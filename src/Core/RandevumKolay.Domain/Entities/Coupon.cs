using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Coupon : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public decimal? MinimumOrderAmount { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }
    public int? UsageLimit { get; private set; }
    public int UsageCount { get; private set; }
    public bool IsActive { get; private set; } = true;
    public List<Guid> ApplicableServiceIds { get; private set; } = new();

    private Coupon() { }

    public static Coupon Create(
        Guid tenantId,
        string code,
        DiscountType discountType,
        decimal discountValue,
        string? description = null,
        decimal? minimumOrderAmount = null,
        DateTimeOffset? expiresAt = null,
        int? usageLimit = null)
    {
        var normalizedExpiresAt = expiresAt?.ToUniversalTime();

        return new Coupon
        {
            TenantId = tenantId,
            Code = code.ToUpperInvariant(),
            DiscountType = discountType,
            DiscountValue = discountValue,
            Description = description,
            MinimumOrderAmount = minimumOrderAmount,
            ExpiresAt = normalizedExpiresAt,
            UsageLimit = usageLimit
        };
    }

    public void Update(string code, string? description, DiscountType discountType,
        decimal discountValue, decimal? minimumOrderAmount, DateTimeOffset? expiresAt, int? usageLimit)
    {
        Code = code.ToUpperInvariant();
        Description = description;
        DiscountType = discountType;
        DiscountValue = discountValue;
        MinimumOrderAmount = minimumOrderAmount;
        ExpiresAt = expiresAt?.ToUniversalTime();
        UsageLimit = usageLimit;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
    public void SetApplicableServices(List<Guid> serviceIds) => ApplicableServiceIds = serviceIds;
    public void IncrementUsage() => UsageCount++;
}
