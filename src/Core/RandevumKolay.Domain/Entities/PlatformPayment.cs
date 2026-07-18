using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum PlatformPaymentType { Subscription, Advertiser, Sponsorship }
public enum PlatformPaymentStatus { Pending, Paid, Failed, Refunded }

/// <summary>
/// Platform-level revenue ledger entry — tenant subscription renewals, or
/// advertiser/sponsorship deals sold directly by the platform. Distinct from
/// <see cref="Payment"/>, which tracks a tenant's own customers paying for
/// appointments.
/// </summary>
public class PlatformPayment : AuditableEntity
{
    public PlatformPaymentType Type { get; private set; }
    public Guid? TenantId { get; private set; }
    public string PayerName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "TRY";
    public PlatformPaymentStatus Status { get; private set; } = PlatformPaymentStatus.Pending;
    public DateTimeOffset? PaidAt { get; private set; }

    // Billing/invoice details — snapshotted at creation time so the ledger entry
    // stays accurate even if the tenant later edits their business address.
    public string? BillingAddress { get; private set; }
    public string? BillingCity { get; private set; }
    public string? BillingCountry { get; private set; }
    public string? TaxNumber { get; private set; }
    public string? TaxOffice { get; private set; }

    private PlatformPayment() { }

    public static PlatformPayment Create(
        PlatformPaymentType type,
        string payerName,
        decimal amount,
        string currency = "TRY",
        Guid? tenantId = null,
        string? description = null,
        PlatformPaymentStatus status = PlatformPaymentStatus.Pending,
        string? billingAddress = null,
        string? billingCity = null,
        string? billingCountry = null,
        string? taxNumber = null,
        string? taxOffice = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payerName);
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));

        var payment = new PlatformPayment
        {
            Type = type,
            TenantId = tenantId,
            PayerName = payerName,
            Description = description,
            Amount = amount,
            Currency = currency,
            Status = status,
            BillingAddress = billingAddress,
            BillingCity = billingCity,
            BillingCountry = billingCountry,
            TaxNumber = taxNumber,
            TaxOffice = taxOffice,
        };

        if (status == PlatformPaymentStatus.Paid)
            payment.PaidAt = DateTimeOffset.UtcNow;

        return payment;
    }

    public void MarkStatus(PlatformPaymentStatus status)
    {
        Status = status;
        if (status == PlatformPaymentStatus.Paid)
            PaidAt = DateTimeOffset.UtcNow;
    }
}
