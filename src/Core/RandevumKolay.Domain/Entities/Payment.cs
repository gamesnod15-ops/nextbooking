using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Payment : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public string? ProviderPaymentId { get; private set; }
    public string? ProviderConversationId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "TRY";
    public PaymentStatus Status { get; private set; }
    public string? FailureReason { get; private set; }
    public Dictionary<string, string> Metadata { get; private set; } = new();
    public DateTimeOffset? PaidAt { get; private set; }

    public Appointment? Appointment { get; private set; }

    private Payment() { }

    public static Payment Create(
        Guid tenantId,
        Guid appointmentId,
        string provider,
        decimal amount,
        string currency = "TRY")
    {
        return new Payment
        {
            TenantId = tenantId,
            AppointmentId = appointmentId,
            Provider = provider,
            Amount = amount,
            Currency = currency,
            Status = PaymentStatus.Pending
        };
    }

    public void MarkAsCompleted(string providerPaymentId)
    {
        ProviderPaymentId = providerPaymentId;
        Status = PaymentStatus.Completed;
        PaidAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsFailed(string reason)
    {
        Status = PaymentStatus.Failed;
        FailureReason = reason;
    }

    public void MarkAsRefunded() => Status = PaymentStatus.Refunded;

    public void SetProviderConversationId(string id) => ProviderConversationId = id;
}

public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3,
    PartiallyRefunded = 4
}
