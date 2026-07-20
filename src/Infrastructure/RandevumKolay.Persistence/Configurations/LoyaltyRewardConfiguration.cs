using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class LoyaltyRewardConfiguration : IEntityTypeConfiguration<LoyaltyReward>
{
    public void Configure(EntityTypeBuilder<LoyaltyReward> builder)
    {
        builder.ToTable("loyalty_rewards");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TenantId).IsRequired();
        builder.Property(r => r.Name).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(1000);
        builder.Property(r => r.PointCost).IsRequired();
        builder.Property(r => r.Category).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(r => r.IsActive).IsRequired();
        builder.Property(r => r.RedeemCount).IsRequired();

        builder.HasIndex(r => r.TenantId);
    }
}
