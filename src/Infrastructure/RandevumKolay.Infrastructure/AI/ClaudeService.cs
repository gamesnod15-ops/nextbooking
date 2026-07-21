using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Features.Appointments.Queries.GetAvailableSlots;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RandevumKolay.Infrastructure.AI;

public class ClaudeService : IClaudeService
{
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";
    private const string AnthropicVersion = "2023-06-01";
    private const int MaxToolRounds = 5;

    private readonly HttpClient _httpClient;
    private readonly AnthropicSettings _settings;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly ISender _sender;
    private readonly ILogger<ClaudeService> _logger;

    public ClaudeService(
        HttpClient httpClient,
        IOptions<AnthropicSettings> settings,
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        ISender sender,
        ILogger<ClaudeService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _context = context;
        _tenantService = tenantService;
        _sender = sender;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_settings.ApiKey);

    public async Task<ClaudeBotReply> GetBotReplyAsync(ClaudeBotContext context, CancellationToken cancellationToken = default)
    {
        var totalInputTokens = 0;
        var totalOutputTokens = 0;

        try
        {
            var systemPrompt = BuildSystemPrompt(context);
            var messages = BuildMessages(context);

            for (var round = 0; round < MaxToolRounds; round++)
            {
                var response = await CallAnthropicAsync(systemPrompt, messages, cancellationToken);
                totalInputTokens += response.Usage?.InputTokens ?? 0;
                totalOutputTokens += response.Usage?.OutputTokens ?? 0;

                if (response.StopReason != "tool_use")
                {
                    var rawText = response.Content.FirstOrDefault(c => c.Type == "text")?.Text;
                    if (string.IsNullOrWhiteSpace(rawText))
                        throw new InvalidOperationException("Claude'dan boş yanıt geldi.");
                    return ParseReply(rawText) with { InputTokens = totalInputTokens, OutputTokens = totalOutputTokens };
                }

                // Echo the assistant's turn back verbatim (text + tool_use blocks),
                // then answer each tool_use with a tool_result — Anthropic requires
                // both to keep the conversation valid for the next round.
                messages.Add(new AnthropicMessage("assistant", response.Content.Select(ToOutBlock).ToList()));

                var toolResults = new List<AnthropicContentBlockOut>();
                foreach (var block in response.Content.Where(c => c.Type == "tool_use"))
                {
                    var result = await ExecuteToolAsync(block.Name!, block.Input, context, cancellationToken);
                    toolResults.Add(new AnthropicContentBlockOut("tool_result", ToolUseId: block.Id, Content: result));
                }
                messages.Add(new AnthropicMessage("user", toolResults));
            }

            throw new InvalidOperationException("Claude çok fazla araç çağrısı yaptı (tur sınırına ulaşıldı).");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API çağrısı başarısız oldu, güvenli varsayılana dönülüyor.");
            return new ClaudeBotReply(
                "Şu anda yanıt veremiyorum, en kısa sürede size dönüş yapacağız.",
                null,
                50,
                LeadTier.Warm,
                true,
                "Bot yanıtı üretilemedi (teknik hata) — insan devralmalı.",
                totalInputTokens,
                totalOutputTokens);
        }
    }

    private async Task<AnthropicResponse> CallAnthropicAsync(string systemPrompt, List<AnthropicMessage> messages, CancellationToken cancellationToken)
    {
        // Cached: the system prompt + tool schemas are identical across every
        // round of one customer message and across consecutive messages in the
        // same conversation — marking it ephemeral-cached gets ~90% off on
        // cache hits instead of re-billing it as fresh input every call.
        var systemBlocks = new List<AnthropicSystemBlock> { new("text", systemPrompt, new { type = "ephemeral" }) };
        var request = new AnthropicRequest(_settings.Model, _settings.MaxTokens, systemBlocks, messages, Tools);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
        {
            Content = JsonContent.Create(request, options: RequestJsonOptions)
        };
        httpRequest.Headers.Add("x-api-key", _settings.ApiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);
        httpRequest.Content!.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AnthropicResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("Claude'dan boş yanıt geldi.");
    }

    // ─── Tools ──────────────────────────────────────────────────────────────

    private static readonly List<AnthropicTool> Tools =
    [
        new(
            "list_services",
            "İşletmenin sunduğu aktif hizmetlerin gerçek listesini (id, isim, süre, fiyat) döner. Bir hizmet isminden veya fiyatından bahsetmeden önce MUTLAKA bunu çağır — asla tahmin etme.",
            new { type = "object", properties = new { }, required = Array.Empty<string>() }),
        new(
            "check_availability",
            "Belirli bir hizmet ve tarih için gerçek müsait saatleri döner. Müşteriye belirli bir saat önermeden önce MUTLAKA bunu çağır — asla tahmin etme.",
            new
            {
                type = "object",
                properties = new
                {
                    serviceId = new { type = "string", description = "list_services'ten alınan gerçek hizmet id'si" },
                    date = new { type = "string", description = "YYYY-MM-DD formatında tarih" },
                },
                required = new[] { "serviceId", "date" },
            }),
        new(
            "propose_booking",
            "Müşteri hizmet, tarih, saat, ad-soyad ve telefon numarasını netleştirdiğinde randevu talebini işletme onayına gönderir. Bu KESİN bir rezervasyon DEĞİLDİR — işletme sahibi panelden onayladıktan sonra kesinleşir, müşteriye bunu açıkça belirt.",
            new
            {
                type = "object",
                properties = new
                {
                    serviceId = new { type = "string" },
                    date = new { type = "string", description = "YYYY-MM-DD" },
                    time = new { type = "string", description = "HH:mm — check_availability sonucunda dönen uygun saatlerden biri olmalı" },
                    customerName = new { type = "string" },
                    customerPhone = new { type = "string" },
                    customerEmail = new { type = "string", description = "opsiyonel" },
                },
                required = new[] { "serviceId", "date", "time", "customerName", "customerPhone" },
            }),
    ];

    private async Task<string> ExecuteToolAsync(string name, JsonElement input, ClaudeBotContext context, CancellationToken cancellationToken)
    {
        try
        {
            return name switch
            {
                "list_services" => await ListServicesAsync(cancellationToken),
                "check_availability" => await CheckAvailabilityAsync(input, cancellationToken),
                "propose_booking" => await ProposeBookingAsync(input, context, cancellationToken),
                _ => JsonSerializer.Serialize(new { error = "Bilinmeyen araç: " + name }),
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Araç çalıştırma hatası: {Tool}", name);
            return JsonSerializer.Serialize(new { error = "Araç çalıştırılırken hata oluştu." });
        }
    }

    private async Task<string> ListServicesAsync(CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var services = await _context.Services
            .Where(s => s.TenantId == tenantId && s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new { id = s.Id, name = s.Name, durationMinutes = s.DurationMinutes, price = s.Price })
            .ToListAsync(cancellationToken);

        return JsonSerializer.Serialize(services);
    }

    private async Task<string> CheckAvailabilityAsync(JsonElement input, CancellationToken cancellationToken)
    {
        var serviceId = Guid.Parse(input.GetProperty("serviceId").GetString()!);
        var date = DateOnly.Parse(input.GetProperty("date").GetString()!);

        var slots = await _sender.Send(new GetAvailableSlotsQuery(null, serviceId, date), cancellationToken);
        var availableTimes = slots
            .Where(s => s.IsAvailable)
            .Select(s => s.StartTime.ToString("HH:mm"))
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        return JsonSerializer.Serialize(new { availableTimes });
    }

    private async Task<string> ProposeBookingAsync(JsonElement input, ClaudeBotContext context, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var serviceId = Guid.Parse(input.GetProperty("serviceId").GetString()!);
        var date = DateOnly.Parse(input.GetProperty("date").GetString()!);
        var time = TimeOnly.Parse(input.GetProperty("time").GetString()!);
        var customerName = input.GetProperty("customerName").GetString()!;
        var customerPhone = input.GetProperty("customerPhone").GetString()!;
        var customerEmail = input.TryGetProperty("customerEmail", out var emailProp) && emailProp.ValueKind == JsonValueKind.String
            ? emailProp.GetString()
            : null;

        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.TenantId == tenantId, cancellationToken);
        if (service is null)
            return JsonSerializer.Serialize(new { success = false, error = "Hizmet bulunamadı." });

        // Not saved here — flushed together with the conversation/messages in
        // SendMessageCommand's single closing SaveChangesAsync (same DbContext,
        // one atomic unit of work).
        var draft = WhatsAppBookingDraft.Create(
            tenantId, context.ConversationId, serviceId, service.Name, date, time,
            customerName, customerPhone, customerEmail);
        _context.WhatsAppBookingDrafts.Add(draft);

        return JsonSerializer.Serialize(new { success = true, message = "Randevu talebi alındı, işletme onayı bekleniyor." });
    }

    // ─── Prompt & message building ─────────────────────────────────────────

    private static string BuildSystemPrompt(ClaudeBotContext context)
    {
        return $$"""
            Sen "{{context.BusinessName}}" işletmesinin WhatsApp asistanısın. Görevin müşterilere yardımcı olmak ve randevu almalarını sağlamak.

            Hizmetler, fiyatlar ve müsaitlik hakkında SADECE sana verilen araçlardan (list_services, check_availability) gelen gerçek verileri kullan — asla tahmin etme veya uydurma.

            Bir randevu talebi oluşturmak için propose_booking aracını SADECE şunlar netleştiğinde çağır: hizmet, tarih, check_availability ile doğrulanmış bir saat, müşterinin adı-soyadı ve telefon numarası. propose_booking bir randevuyu KESİNLEŞTİRMEZ — sadece işletme onayına gönderir; müşteriye bunu açıkça, "talebiniz alındı, onaylandığında size haber vereceğiz" gibi bir dille belirt, asla "randevunuz kesinleşti" deme.

            Kurallar:
            - Her zaman Türkçe, sıcak ve profesyonel bir dille yanıt ver.
            - Araçlarla doğrulanamayan bir konu (fiyat pazarlığı, şikayet, listelenmeyen bir hizmet talebi, hassas/acil bir konu) gelirse "shouldEscalate": true yap ve müşteriye işletme sahibinin en kısa sürede döneceğini nazikçe söyle.
            - Konuşma geçmişini dikkate alarak bağlamlı yanıt ver, önceden sorulan bilgileri tekrar sorma.
            - Müşterinin randevu almaya ne kadar istekli/yakın olduğunu 0-100 arası bir "leadScore" ile değerlendir (100 = randevu talebi gönderildi/gönderilmeye hazır, 0 = sadece genel bilgi soruyor).

            Araç kullanıp kullanmadığına bakılmaksızın, son yanıtın SADECE aşağıdaki JSON şemasına uygun, başka hiçbir açıklama veya markdown eklemeden olmalı:
            {"replyText": "müşteriye gönderilecek mesaj", "extractedFields": {"service": "...", "preferredDate": "...", "customerName": "..."} veya null, "leadScore": 0-100 arası tam sayı, "leadTier": "Cold" | "Warm" | "Hot", "shouldEscalate": true veya false, "escalationReason": "..." veya null}
            """;
    }

    /// Bounds worst-case cost/context size for very long conversations — the
    /// full history was previously resent unbounded on every single call.
    private const int MaxHistoryTurns = 16;

    private static List<AnthropicMessage> BuildMessages(ClaudeBotContext context)
    {
        var messages = new List<AnthropicMessage>();
        foreach (var turn in context.History.TakeLast(MaxHistoryTurns))
        {
            var role = turn.Role == MessageRole.Customer ? "user" : "assistant";
            var text = turn.Role == MessageRole.Owner ? $"[İşletme sahibi yazdı]: {turn.Text}" : turn.Text;
            messages.Add(new AnthropicMessage(role, [new AnthropicContentBlockOut("text", Text: text)]));
        }
        messages.Add(new AnthropicMessage("user", [new AnthropicContentBlockOut("text", Text: context.IncomingMessage)]));
        return messages;
    }

    private static AnthropicContentBlockOut ToOutBlock(AnthropicContentBlock block) =>
        block.Type == "tool_use"
            ? new AnthropicContentBlockOut("tool_use", Id: block.Id, Name: block.Name, Input: block.Input)
            : new AnthropicContentBlockOut("text", Text: block.Text);

    // ─── Final-reply parsing ────────────────────────────────────────────────

    private static ClaudeBotReply ParseReply(string rawText)
    {
        var json = ExtractJson(rawText);
        var parsed = JsonSerializer.Deserialize<ClaudeReplyPayload>(json, ResponseJsonOptions)
            ?? throw new InvalidOperationException("Claude yanıtı ayrıştırılamadı.");

        var tier = Enum.TryParse<LeadTier>(parsed.LeadTier, ignoreCase: true, out var t) ? t : LeadTier.Cold;
        var extractedJson = parsed.ExtractedFields.ValueKind == JsonValueKind.Undefined
            ? null
            : parsed.ExtractedFields.GetRawText();

        return new ClaudeBotReply(
            parsed.ReplyText,
            extractedJson,
            Math.Clamp(parsed.LeadScore, 0, 100),
            tier,
            parsed.ShouldEscalate,
            parsed.EscalationReason);
    }

    /// Claude sometimes wraps JSON in ```json fences despite instructions — strip them defensively.
    private static string ExtractJson(string text)
    {
        var trimmed = text.Trim();
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            var lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewline > 0 && lastFence > firstNewline)
                trimmed = trimmed[(firstNewline + 1)..lastFence].Trim();
        }
        return trimmed;
    }

    private static readonly JsonSerializerOptions ResponseJsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly JsonSerializerOptions RequestJsonOptions = new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    // ─── Anthropic Messages API wire types ──────────────────────────────────

    private record AnthropicRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("max_tokens")] int MaxTokens,
        [property: JsonPropertyName("system")] List<AnthropicSystemBlock> System,
        [property: JsonPropertyName("messages")] List<AnthropicMessage> Messages,
        [property: JsonPropertyName("tools")] List<AnthropicTool> Tools);

    private record AnthropicSystemBlock(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string Text,
        [property: JsonPropertyName("cache_control")] object? CacheControl = null);

    private record AnthropicTool(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("description")] string Description,
        [property: JsonPropertyName("input_schema")] object InputSchema);

    private record AnthropicMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] List<AnthropicContentBlockOut> Content);

    /// Outgoing content block — one flexible shape covers plain text, an
    /// echoed-back tool_use, and a tool_result; unset fields are omitted via
    /// RequestJsonOptions (DefaultIgnoreCondition = WhenWritingNull).
    private record AnthropicContentBlockOut(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string? Text = null,
        [property: JsonPropertyName("id")] string? Id = null,
        [property: JsonPropertyName("name")] string? Name = null,
        [property: JsonPropertyName("input")] JsonElement? Input = null,
        [property: JsonPropertyName("tool_use_id")] string? ToolUseId = null,
        [property: JsonPropertyName("content")] string? Content = null);

    private record AnthropicResponse(
        [property: JsonPropertyName("content")] List<AnthropicContentBlock> Content,
        [property: JsonPropertyName("stop_reason")] string? StopReason,
        [property: JsonPropertyName("usage")] AnthropicUsage? Usage);

    private record AnthropicUsage(
        [property: JsonPropertyName("input_tokens")] int InputTokens,
        [property: JsonPropertyName("output_tokens")] int OutputTokens);

    private record AnthropicContentBlock(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string? Text,
        [property: JsonPropertyName("id")] string? Id,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("input")] JsonElement Input);

    private record ClaudeReplyPayload(
        [property: JsonPropertyName("replyText")] string ReplyText,
        [property: JsonPropertyName("extractedFields")] JsonElement ExtractedFields,
        [property: JsonPropertyName("leadScore")] int LeadScore,
        [property: JsonPropertyName("leadTier")] string LeadTier,
        [property: JsonPropertyName("shouldEscalate")] bool ShouldEscalate,
        [property: JsonPropertyName("escalationReason")] string? EscalationReason);
}
