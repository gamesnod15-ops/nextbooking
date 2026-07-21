using System.Globalization;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Features.Appointments.Queries.GetAvailableSlots;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Infrastructure.AI;

/// <summary>
/// Deterministic slot-filling booking flow — see IFallbackBookingService for
/// why this exists. Every step re-reads real data (services, availability)
/// straight from the same queries/tables Claude's tools use; nothing here is
/// invented or cached client-side, and every escalation resets the flow so
/// the conversation starts fresh (and re-checks quota) next time.
/// </summary>
public class FallbackBookingService : IFallbackBookingService
{
    private const int MaxRetries = 3;

    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public FallbackBookingService(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<ClaudeBotReply> GetReplyAsync(WhatsAppConversation conversation, string incomingMessage, CancellationToken cancellationToken = default)
    {
        if (conversation.AutomationStep == AutomationStep.None)
        {
            conversation.StartAutomation();
            return await BuildServiceMenuAsync(conversation.TenantId, cancellationToken);
        }

        return conversation.AutomationStep switch
        {
            AutomationStep.AwaitingService => await HandleAwaitingServiceAsync(conversation, incomingMessage, cancellationToken),
            AutomationStep.AwaitingDate => await HandleAwaitingDateAsync(conversation, incomingMessage, cancellationToken),
            AutomationStep.AwaitingTime => await HandleAwaitingTimeAsync(conversation, incomingMessage, cancellationToken),
            AutomationStep.AwaitingName => HandleAwaitingName(conversation, incomingMessage),
            AutomationStep.AwaitingPhone => HandleAwaitingPhone(conversation, incomingMessage),
            AutomationStep.Confirming => HandleConfirming(conversation, incomingMessage),
            _ => Escalate(conversation, "Otomasyon: bilinmeyen adım."),
        };
    }

    // ─── Step handlers ──────────────────────────────────────────────────────

    private async Task<ClaudeBotReply> HandleAwaitingServiceAsync(WhatsAppConversation conversation, string message, CancellationToken ct)
    {
        var services = await ActiveServicesAsync(conversation.TenantId, ct);
        var match = MatchByIndexOrSubstring(message, services, s => s.Name);

        if (match is null)
        {
            conversation.IncrementRetry();
            if (conversation.RetryCount >= MaxRetries)
                return Escalate(conversation, "Otomasyon: hizmet seçilemedi.");

            var menu = await BuildServiceMenuAsync(conversation.TenantId, ct, "Anlayamadım, lütfen listeden bir numara yazın:\n\n");
            return menu;
        }

        conversation.SetPendingService(match.Id, match.Name);
        return Reply($"\"{match.Name}\" seçtiniz. Hangi gün için randevu istersiniz? (örn: bugün, yarın, 25.07)", 30);
    }

    private async Task<ClaudeBotReply> HandleAwaitingDateAsync(WhatsAppConversation conversation, string message, CancellationToken ct)
    {
        var date = TryParseTurkishDate(message);
        if (date is null)
        {
            conversation.IncrementRetry();
            if (conversation.RetryCount >= MaxRetries)
                return Escalate(conversation, "Otomasyon: tarih anlaşılamadı.");
            return Reply("Tarihi anlayamadım. Lütfen \"bugün\", \"yarın\" veya gün.ay (örn: 25.07) formatında yazın.", 30);
        }

        var slots = await AvailableTimesAsync(conversation.PendingServiceId!.Value, date.Value, ct);
        if (slots.Count == 0)
        {
            // Not a parsing failure — a real but unavailable date. Ask again
            // without counting it against the retry limit.
            return Reply($"{date:dd.MM.yyyy} için müsait saat bulunamadı. Başka bir gün ister misiniz?", 30);
        }

        conversation.SetPendingDate(date.Value);
        return Reply($"{date:dd.MM.yyyy} için uygun saatler:\n\n{FormatNumberedList(slots)}\n\nHangi saati istersiniz? Numarasını yazın.", 50);
    }

    private async Task<ClaudeBotReply> HandleAwaitingTimeAsync(WhatsAppConversation conversation, string message, CancellationToken ct)
    {
        var slots = await AvailableTimesAsync(conversation.PendingServiceId!.Value, conversation.PendingDate!.Value, ct);
        var match = MatchTimeSlot(message, slots);

        if (match is null)
        {
            conversation.IncrementRetry();
            if (conversation.RetryCount >= MaxRetries)
                return Escalate(conversation, "Otomasyon: saat seçilemedi.");
            return Reply($"Anlayamadım. Lütfen listeden bir numara yazın:\n\n{FormatNumberedList(slots)}", 50);
        }

        conversation.SetPendingTime(match.Value);
        return Reply("Adınızı ve soyadınızı öğrenebilir miyim?", 60);
    }

    private static ClaudeBotReply HandleAwaitingName(WhatsAppConversation conversation, string message)
    {
        var name = message.Trim();
        if (name.Length == 0)
            return Reply("Adınızı ve soyadınızı yazar mısınız?", 60);

        conversation.SetPendingName(name);
        return Reply("Son olarak telefon numaranızı alabilir miyim? (örn: 0532 000 00 00)", 70);
    }

    private static ClaudeBotReply HandleAwaitingPhone(WhatsAppConversation conversation, string message)
    {
        var normalized = NormalizeMobilePhone(message);
        if (normalized is null)
        {
            conversation.IncrementRetry();
            if (conversation.RetryCount >= MaxRetries)
                return Escalate(conversation, "Otomasyon: telefon numarası doğrulanamadı.");
            return Reply("Bu telefon numarasını tanıyamadım. Lütfen 05XX XXX XX XX formatında yazın.", 70);
        }

        conversation.SetPendingPhone(normalized);
        var summary =
            $"Randevu özeti:\n" +
            $"Hizmet: {conversation.PendingServiceName}\n" +
            $"Tarih: {conversation.PendingDate:dd.MM.yyyy}\n" +
            $"Saat: {conversation.PendingTime:HH:mm}\n" +
            $"Ad: {conversation.PendingName}\n" +
            $"Telefon: {normalized}\n\n" +
            $"Onaylıyor musunuz? (Evet/Hayır)";
        return Reply(summary, 90);
    }

    private ClaudeBotReply HandleConfirming(WhatsAppConversation conversation, string message)
    {
        var normalized = message.Trim().ToLowerInvariant();
        var isYes = normalized is "evet" or "e" or "tamam" or "onaylıyorum" or "onayliyorum" or "yes";
        var isNo = normalized is "hayır" or "hayir" or "h" or "iptal" or "no";

        if (isYes)
        {
            var draft = WhatsAppBookingDraft.Create(
                conversation.TenantId,
                conversation.Id,
                conversation.PendingServiceId!.Value,
                conversation.PendingServiceName!,
                conversation.PendingDate!.Value,
                conversation.PendingTime!.Value,
                conversation.PendingName!,
                conversation.PendingPhone!,
                null);
            _context.WhatsAppBookingDrafts.Add(draft);

            conversation.ResetAutomation();
            return new ClaudeBotReply(
                "Randevu talebiniz alındı, işletme onayladığında haber vereceğiz.",
                null, 100, LeadTier.Hot, false, null);
        }

        if (isNo)
        {
            conversation.ResetAutomation();
            conversation.StartAutomation();
            return Reply("Tamam, baştan başlayalım. Hangi hizmeti almak istersiniz?", 30);
        }

        conversation.IncrementRetry();
        if (conversation.RetryCount >= MaxRetries)
            return Escalate(conversation, "Otomasyon: onay adımında anlaşılamadı.");
        return Reply("Anlayamadım — onaylıyor musunuz? Lütfen \"Evet\" veya \"Hayır\" yazın.", 90);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private async Task<List<Service>> ActiveServicesAsync(Guid tenantId, CancellationToken ct) =>
        await _context.Services
            .Where(s => s.TenantId == tenantId && s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ToListAsync(ct);

    private async Task<ClaudeBotReply> BuildServiceMenuAsync(Guid tenantId, CancellationToken ct, string prefix = "")
    {
        var services = await ActiveServicesAsync(tenantId, ct);
        if (services.Count == 0)
            return Escalate(null, "Otomasyon: tanımlı hizmet bulunamadı.");

        var lines = services.Select((s, i) => $"{i + 1}. {s.Name} — {s.DurationMinutes} dk — {s.Price}₺");
        return Reply($"{prefix}Hangi hizmeti almak istersiniz?\n\n{string.Join("\n", lines)}\n\nNumarasını yazabilirsiniz.", 20);
    }

    private async Task<List<TimeSlotDto>> AvailableTimesAsync(Guid serviceId, DateOnly date, CancellationToken ct)
    {
        var slots = await _sender.Send(new GetAvailableSlotsQuery(null, serviceId, date), ct);
        return slots.Where(s => s.IsAvailable).OrderBy(s => s.StartTime).ToList();
    }

    private static string FormatNumberedList(List<TimeSlotDto> slots) =>
        string.Join("\n", slots.Select((s, i) => $"{i + 1}. {s.StartTime:HH:mm}"));

    private static Service? MatchByIndexOrSubstring(string message, List<Service> services, Func<Service, string> nameSelector)
    {
        var trimmed = message.Trim();
        var digits = Regex.Match(trimmed, @"^\d+");
        if (digits.Success && int.TryParse(digits.Value, out var index) && index >= 1 && index <= services.Count)
            return services[index - 1];

        var matches = services.Where(s => nameSelector(s).Contains(trimmed, StringComparison.OrdinalIgnoreCase)).ToList();
        return matches.Count == 1 ? matches[0] : null;
    }

    private static TimeOnly? MatchTimeSlot(string message, List<TimeSlotDto> slots)
    {
        var trimmed = message.Trim();
        var digits = Regex.Match(trimmed, @"^\d+");
        if (digits.Success && int.TryParse(digits.Value, out var index) && index >= 1 && index <= slots.Count)
            return TimeOnly.FromDateTime(slots[index - 1].StartTime.DateTime);

        var timeMatch = Regex.Match(trimmed, @"(\d{1,2})[:.](\d{2})");
        if (timeMatch.Success)
        {
            var hh = int.Parse(timeMatch.Groups[1].Value);
            var mm = int.Parse(timeMatch.Groups[2].Value);
            var candidate = slots.FirstOrDefault(s => s.StartTime.Hour == hh && s.StartTime.Minute == mm);
            if (candidate is not null)
                return TimeOnly.FromDateTime(candidate.StartTime.DateTime);
        }

        return null;
    }

    private static DateOnly? TryParseTurkishDate(string message)
    {
        var trimmed = message.Trim().ToLowerInvariant();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (trimmed.Contains("bugün") || trimmed.Contains("bugun")) return today;
        if (trimmed.Contains("yarın") || trimmed.Contains("yarin")) return today.AddDays(1);

        if (DateOnly.TryParseExact(trimmed, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var iso))
            return iso;

        var match = Regex.Match(trimmed, @"^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?$");
        if (match.Success)
        {
            var day = int.Parse(match.Groups[1].Value);
            var month = int.Parse(match.Groups[2].Value);
            var year = match.Groups[3].Success ? int.Parse(match.Groups[3].Value) : today.Year;
            if (day is >= 1 and <= 31 && month is >= 1 and <= 12)
            {
                try
                {
                    var candidate = new DateOnly(year, month, day);
                    // A bare dd.mm before today's date almost certainly means next year.
                    return !match.Groups[3].Success && candidate < today ? candidate.AddYears(1) : candidate;
                }
                catch (ArgumentOutOfRangeException) { return null; }
            }
        }

        return null;
    }

    private static string? NormalizeMobilePhone(string message)
    {
        var digits = Regex.Replace(message, @"\D", "");
        if (digits.StartsWith("90") && digits.Length == 12) digits = digits[2..];
        else if (digits.StartsWith("0") && digits.Length == 11) digits = digits[1..];

        return digits.Length == 10 && digits[0] == '5' ? $"+90{digits}" : null;
    }

    private static ClaudeBotReply Reply(string text, int leadScore) =>
        new(text, null, leadScore, LeadTierForScore(leadScore), false, null);

    private static LeadTier LeadTierForScore(int score) =>
        score >= 70 ? LeadTier.Hot : score >= 40 ? LeadTier.Warm : LeadTier.Cold;

    private static ClaudeBotReply Escalate(WhatsAppConversation? conversation, string reason)
    {
        conversation?.ResetAutomation();
        return new ClaudeBotReply(
            "Şu anda size doğrudan yardımcı olamıyorum, işletme sahibi en kısa sürede size dönüş yapacak.",
            null, 50, LeadTier.Warm, true, reason);
    }
}
