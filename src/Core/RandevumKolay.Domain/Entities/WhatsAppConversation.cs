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

    // Deterministic fallback-booking flow state (used only once the tenant's
    // free Claude quota is exhausted for the month — see IFallbackBookingService).
    public AutomationStep AutomationStep { get; private set; } = AutomationStep.None;
    public Guid? PendingServiceId { get; private set; }
    public string? PendingServiceName { get; private set; }
    public DateOnly? PendingDate { get; private set; }
    public TimeOnly? PendingTime { get; private set; }
    public string? PendingName { get; private set; }
    public string? PendingPhone { get; private set; }
    public int RetryCount { get; private set; }

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

    public void StartAutomation()
    {
        AutomationStep = AutomationStep.AwaitingService;
        RetryCount = 0;
    }

    public void SetPendingService(Guid serviceId, string serviceName)
    {
        PendingServiceId = serviceId;
        PendingServiceName = serviceName;
        AutomationStep = AutomationStep.AwaitingDate;
        RetryCount = 0;
    }

    public void SetPendingDate(DateOnly date)
    {
        PendingDate = date;
        AutomationStep = AutomationStep.AwaitingTime;
        RetryCount = 0;
    }

    public void SetPendingTime(TimeOnly time)
    {
        PendingTime = time;
        AutomationStep = AutomationStep.AwaitingName;
        RetryCount = 0;
    }

    public void SetPendingName(string name)
    {
        PendingName = name;
        AutomationStep = AutomationStep.AwaitingPhone;
        RetryCount = 0;
    }

    public void SetPendingPhone(string phone)
    {
        PendingPhone = phone;
        AutomationStep = AutomationStep.Confirming;
        RetryCount = 0;
    }

    public void IncrementRetry() => RetryCount++;

    public void ResetAutomation()
    {
        AutomationStep = AutomationStep.None;
        PendingServiceId = null;
        PendingServiceName = null;
        PendingDate = null;
        PendingTime = null;
        PendingName = null;
        PendingPhone = null;
        RetryCount = 0;
    }
}
