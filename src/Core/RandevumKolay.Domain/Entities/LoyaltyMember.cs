using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class LoyaltyMember : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid CustomerId { get; private set; }
    public int Points { get; private set; }

    public Customer? Customer { get; private set; }

    private LoyaltyMember() { }

    public static LoyaltyMember Create(Guid tenantId, Guid customerId, int startingPoints = 0)
    {
        if (startingPoints < 0)
            throw new ArgumentOutOfRangeException(nameof(startingPoints));

        return new LoyaltyMember
        {
            TenantId = tenantId,
            CustomerId = customerId,
            Points = startingPoints
        };
    }

    public void AddPoints(int points)
    {
        if (points < 0)
            throw new ArgumentOutOfRangeException(nameof(points));

        Points += points;
    }

    public void RedeemPoints(int points)
    {
        if (points < 0)
            throw new ArgumentOutOfRangeException(nameof(points));
        if (points > Points)
            throw new InvalidOperationException("Yetersiz puan bakiyesi.");

        Points -= points;
    }
}
