using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum GiftCouponStatus { Active, Used, Expired }

public class GiftCoupon : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string RecipientName { get; private set; } = string.Empty;
    public string? RecipientEmail { get; private set; }
    public string PurchasedBy { get; private set; } = string.Empty;
    public DateTimeOffset PurchaseDate { get; private set; }
    public DateTimeOffset? ExpiryDate { get; private set; }
    public decimal UsedAmount { get; private set; }
    public GiftCouponStatus Status { get; private set; } = GiftCouponStatus.Active;
    public string? Message { get; private set; }

    private GiftCoupon() { }

    public static GiftCoupon Create(
        Guid tenantId,
        string code,
        decimal amount,
        string recipientName,
        string? recipientEmail,
        string purchasedBy,
        DateTimeOffset? expiryDate,
        string? message)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.");

        var normalizedExpiryDate = expiryDate?.ToUniversalTime();

        return new GiftCoupon
        {
            TenantId = tenantId,
            Code = code.ToUpperInvariant(),
            Amount = amount,
            RecipientName = recipientName,
            RecipientEmail = recipientEmail,
            PurchasedBy = purchasedBy,
            PurchaseDate = DateTimeOffset.UtcNow,
            ExpiryDate = normalizedExpiryDate,
            Message = message,
            Status = GiftCouponStatus.Active
        };
    }

    public void Update(
        string recipientName,
        string? recipientEmail,
        string purchasedBy,
        DateTimeOffset? expiryDate,
        string? message)
    {
        RecipientName = recipientName;
        RecipientEmail = recipientEmail;
        PurchasedBy = purchasedBy;
        ExpiryDate = expiryDate?.ToUniversalTime();
        Message = message;
    }

    public void SetStatus(GiftCouponStatus status) => Status = status;

    public void AddUsage(decimal usedAmount)
    {
        if (usedAmount <= 0) throw new ArgumentException("Used amount must be greater than zero.");
        UsedAmount += usedAmount;
        if (UsedAmount >= Amount) Status = GiftCouponStatus.Used;
    }
}
