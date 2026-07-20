using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class LoyaltyRedemptionConfiguration : IEntityTypeConfiguration<LoyaltyRedemption>
{
    public void Configure(EntityTypeBuilder<LoyaltyRedemption> builder)
    {
        builder.ToTable("loyalty_redemptions");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TenantId).IsRequired();
        builder.Property(r => r.LoyaltyMemberId).IsRequired();
        builder.Property(r => r.RewardId).IsRequired();
        builder.Property(r => r.PointsSpent).IsRequired();
        builder.Property(r => r.RedeemedAt).IsRequired();

        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.LoyaltyMemberId);
    }
}
