using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class WhatsAppMessage : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ConversationId { get; private set; }
    // AuditableEntityInterceptor stamps every entity added within the same
    // SaveChangesAsync call with one identical CreatedAt, so a customer
    // message and the bot's reply saved together are otherwise
    // indistinguishable by time — this gives deterministic ordering instead.
    public int Sequence { get; private set; }
    public MessageRole Role { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public string? ExtractedDataJson { get; private set; }

    public WhatsAppConversation? Conversation { get; private set; }

    private WhatsAppMessage() { }

    public static WhatsAppMessage Create(
        Guid tenantId,
        Guid conversationId,
        int sequence,
        MessageRole role,
        string text,
        string? extractedDataJson = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(text);

        return new WhatsAppMessage
        {
            TenantId = tenantId,
            ConversationId = conversationId,
            Sequence = sequence,
            Role = role,
            Text = text,
            ExtractedDataJson = extractedDataJson
        };
    }
}
