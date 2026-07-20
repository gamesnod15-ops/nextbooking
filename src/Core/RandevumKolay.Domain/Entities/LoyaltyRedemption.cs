using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class LoyaltyRedemption : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid LoyaltyMemberId { get; private set; }
    public Guid RewardId { get; private set; }
    public int PointsSpent { get; private set; }
    public DateTimeOffset RedeemedAt { get; private set; }

    private LoyaltyRedemption() { }

    public static LoyaltyRedemption Create(Guid tenantId, Guid loyaltyMemberId, Guid rewardId, int pointsSpent)
    {
        return new LoyaltyRedemption
        {
            TenantId = tenantId,
            LoyaltyMemberId = loyaltyMemberId,
            RewardId = rewardId,
            PointsSpent = pointsSpent,
            RedeemedAt = DateTimeOffset.UtcNow
        };
    }
}
