using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RandevumKolay.Application.Common.Interfaces;
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

    private readonly HttpClient _httpClient;
    private readonly AnthropicSettings _settings;
    private readonly ILogger<ClaudeService> _logger;

    public ClaudeService(HttpClient httpClient, IOptions<AnthropicSettings> settings, ILogger<ClaudeService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<ClaudeBotReply> GetBotReplyAsync(ClaudeBotContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new AnthropicRequest(
                _settings.Model,
                _settings.MaxTokens,
                BuildSystemPrompt(context),
                BuildMessages(context));

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ApiUrl)
            {
                Content = JsonContent.Create(request)
            };
            httpRequest.Headers.Add("x-api-key", _settings.ApiKey);
            httpRequest.Headers.Add("anthropic-version", AnthropicVersion);
            httpRequest.Content!.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<AnthropicResponse>(cancellationToken: cancellationToken);
            var rawText = payload?.Content.FirstOrDefault(c => c.Type == "text")?.Text;

            if (string.IsNullOrWhiteSpace(rawText))
                throw new InvalidOperationException("Claude'dan boş yanıt geldi.");

            return ParseReply(rawText);
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
                "Bot yanıtı üretilemedi (teknik hata) — insan devralmalı.");
        }
    }

    private static string BuildSystemPrompt(ClaudeBotContext context)
    {
        var services = context.Services.Count > 0 ? string.Join(", ", context.Services) : "belirtilmemiş";
        var hours = context.WorkingHours.Count > 0 ? string.Join("; ", context.WorkingHours) : "belirtilmemiş";

        return $$"""
            Sen "{{context.BusinessName}}" işletmesinin WhatsApp asistanısın. Görevin müşterilere yardımcı olmak ve randevu almalarını sağlamak.

            İşletme bilgileri:
            - Sunulan hizmetler: {{services}}
            - Çalışma saatleri: {{hours}}

            Kurallar:
            - Her zaman Türkçe, sıcak ve profesyonel bir dille yanıt ver.
            - Sadece yukarıda listelenen hizmetler ve çalışma saatleri hakkında kesin bilgi ver. Fiyat pazarlığı, şikayet, listelenmeyen bir hizmet talebi veya hassas/acil bir konu gelirse "shouldEscalate": true yap ve müşteriye işletme sahibinin en kısa sürede döneceğini nazikçe söyle.
            - Konuşma geçmişini dikkate alarak bağlamlı yanıt ver, önceden sorulan bilgileri tekrar sorma.
            - Müşterinin randevu almaya ne kadar istekli/yakın olduğunu 0-100 arası bir "leadScore" ile değerlendir (100 = hemen randevu almaya hazır/tarih-saat netleşti, 0 = sadece genel bilgi soruyor).

            Yanıtını SADECE aşağıdaki JSON şemasına uygun, başka hiçbir açıklama veya markdown eklemeden ver:
            {"replyText": "müşteriye gönderilecek mesaj", "extractedFields": {"service": "...", "preferredDate": "...", "customerName": "..."} veya null, "leadScore": 0-100 arası tam sayı, "leadTier": "Cold" | "Warm" | "Hot", "shouldEscalate": true veya false, "escalationReason": "..." veya null}
            """;
    }

    private static List<AnthropicMessage> BuildMessages(ClaudeBotContext context)
    {
        var messages = new List<AnthropicMessage>();
        foreach (var turn in context.History)
        {
            var role = turn.Role == MessageRole.Customer ? "user" : "assistant";
            var text = turn.Role == MessageRole.Owner ? $"[İşletme sahibi yazdı]: {turn.Text}" : turn.Text;
            messages.Add(new AnthropicMessage(role, text));
        }
        messages.Add(new AnthropicMessage("user", context.IncomingMessage));
        return messages;
    }

    private static ClaudeBotReply ParseReply(string rawText)
    {
        var json = ExtractJson(rawText);
        var parsed = JsonSerializer.Deserialize<ClaudeReplyPayload>(json, JsonOptions)
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

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private record AnthropicRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("max_tokens")] int MaxTokens,
        [property: JsonPropertyName("system")] string System,
        [property: JsonPropertyName("messages")] List<AnthropicMessage> Messages);

    private record AnthropicMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    private record AnthropicResponse(
        [property: JsonPropertyName("content")] List<AnthropicContentBlock> Content);

    private record AnthropicContentBlock(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string? Text);

    private record ClaudeReplyPayload(
        [property: JsonPropertyName("replyText")] string ReplyText,
        [property: JsonPropertyName("extractedFields")] JsonElement ExtractedFields,
        [property: JsonPropertyName("leadScore")] int LeadScore,
        [property: JsonPropertyName("leadTier")] string LeadTier,
        [property: JsonPropertyName("shouldEscalate")] bool ShouldEscalate,
        [property: JsonPropertyName("escalationReason")] string? EscalationReason);
}
