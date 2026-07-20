using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class LoyaltyReward : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int PointCost { get; private set; }
    public LoyaltyRewardCategory Category { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int RedeemCount { get; private set; }

    private LoyaltyReward() { }

    public static LoyaltyReward Create(
        Guid tenantId,
        string name,
        string? description,
        int pointCost,
        LoyaltyRewardCategory category)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (pointCost <= 0)
            throw new ArgumentOutOfRangeException(nameof(pointCost));

        return new LoyaltyReward
        {
            TenantId = tenantId,
            Name = name,
            Description = description,
            PointCost = pointCost,
            Category = category
        };
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
    public void IncrementRedeemCount() => RedeemCount++;
}
