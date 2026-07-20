using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class LoyaltyTierConfiguration : IEntityTypeConfiguration<LoyaltyTier>
{
    public void Configure(EntityTypeBuilder<LoyaltyTier> builder)
    {
        builder.ToTable("loyalty_tiers");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TenantId).IsRequired();
        builder.Property(t => t.Name).HasMaxLength(100).IsRequired();
        builder.Property(t => t.MinPoints).IsRequired();
        builder.Property(t => t.Multiplier).HasColumnType("decimal(5,2)").IsRequired();
        builder.Property(t => t.Color).HasMaxLength(200).IsRequired();
        builder.Property(t => t.IconName).HasMaxLength(50).IsRequired();
        builder.Property(t => t.SortOrder).IsRequired();

        builder.Property(t => t.Benefits).HasColumnType("text[]");

        builder.HasIndex(t => t.TenantId);
    }
}
