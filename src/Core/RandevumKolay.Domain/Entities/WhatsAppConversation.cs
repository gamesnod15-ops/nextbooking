using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class WhatsAppConversation : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string CustomerPhone { get; private set; } = string.Empty;
    public string? CustomerName { get; private set; }
    public Guid? CustomerId { get; private set; }
    public ConversationStatus Status { get; private set; } = ConversationStatus.Bot;
    public int LeadScore { get; private set; }
    public LeadTier LeadTier { get; private set; } = LeadTier.Cold;
    public string? EscalationReason { get; private set; }
    public DateTimeOffset LastMessageAt { get; private set; }

    public Customer? Customer { get; private set; }
    private readonly List<WhatsAppMessage> _messages = new();
    public IReadOnlyCollection<WhatsAppMessage> Messages => _messages.AsReadOnly();

    private WhatsAppConversation() { }

    public static WhatsAppConversation Create(
        Guid tenantId,
        string customerPhone,
        string? customerName = null,
        Guid? customerId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(customerPhone);

        return new WhatsAppConversation
        {
            TenantId = tenantId,
            CustomerPhone = customerPhone,
            CustomerName = customerName,
            CustomerId = customerId,
            LastMessageAt = DateTimeOffset.UtcNow
        };
    }

    public void LinkCustomer(Guid customerId, string customerName)
    {
        CustomerId = customerId;
        CustomerName = customerName;
    }

    public void TouchLastMessage() => LastMessageAt = DateTimeOffset.UtcNow;

    public void ApplyBotAssessment(int leadScore, LeadTier leadTier, bool shouldEscalate, string? escalationReason)
    {
        LeadScore = Math.Clamp(leadScore, 0, 100);
        LeadTier = leadTier;
        LastMessageAt = DateTimeOffset.UtcNow;

        if (shouldEscalate && Status == ConversationStatus.Bot)
        {
            Status = ConversationStatus.Escalated;
            EscalationReason = escalationReason;
        }
    }

    public void Escalate(string reason)
    {
        Status = ConversationStatus.Escalated;
        EscalationReason = reason;
    }

    public void Resolve()
    {
        Status = ConversationStatus.Bot;
        EscalationReason = null;
    }
}
