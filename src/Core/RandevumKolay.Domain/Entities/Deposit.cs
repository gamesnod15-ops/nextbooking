using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class Deposit : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "TRY";
    public DepositStatus Status { get; private set; }
    public string PaymentMethod { get; private set; } = "CreditCard";
    public string? PaymentProvider { get; private set; }
    public string? ProviderPaymentId { get; private set; }
    public DateTimeOffset? PaidAt { get; private set; }
    public DateTimeOffset? RefundedAt { get; private set; }
    public string? Notes { get; private set; }

    public Appointment? Appointment { get; private set; }

    private Deposit() { }

    public static Deposit Create(
        Guid tenantId,
        Guid appointmentId,
        decimal amount,
        string paymentMethod = "CreditCard",
        string? notes = null,
        Guid? customerId = null)
    {
        return new Deposit
        {
            TenantId = tenantId,
            AppointmentId = appointmentId,
            CustomerId = customerId,
            Amount = amount,
            PaymentMethod = paymentMethod,
            Status = DepositStatus.Pending,
            Notes = notes
        };
    }

    public void MarkAsPaid(string provider, string providerPaymentId)
    {
        Status = DepositStatus.Paid;
        PaymentProvider = provider;
        ProviderPaymentId = providerPaymentId;
        PaidAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsApplied()
    {
        if (Status != DepositStatus.Paid)
            throw new InvalidOperationException("Only paid deposits can be applied.");

        Status = DepositStatus.Applied;
    }

    public void MarkAsRefunded()
    {
        if (Status != DepositStatus.Paid && Status != DepositStatus.Applied)
            throw new InvalidOperationException("Only paid or applied deposits can be refunded.");

        Status = DepositStatus.Refunded;
        RefundedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsForfeited()
    {
        if (Status != DepositStatus.Paid)
            throw new InvalidOperationException("Only paid deposits can be forfeited.");

        Status = DepositStatus.Forfeited;
    }

    public void Cancel()
    {
        if (Status != DepositStatus.Pending)
            throw new InvalidOperationException("Only pending deposits can be cancelled.");

        Status = DepositStatus.Cancelled;
    }
}
