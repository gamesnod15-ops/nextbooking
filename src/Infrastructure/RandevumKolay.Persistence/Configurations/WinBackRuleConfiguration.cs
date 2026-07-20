using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WinBackRuleConfiguration : IEntityTypeConfiguration<WinBackRule>
{
    public void Configure(EntityTypeBuilder<WinBackRule> builder)
    {
        builder.ToTable("win_back_rules");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TenantId).IsRequired();
        builder.Property(r => r.DaysSinceLastVisit).IsRequired();
        builder.Property(r => r.MessageTemplate).HasMaxLength(1000).IsRequired();
        builder.Property(r => r.IsActive).IsRequired();

        builder.HasIndex(r => r.TenantId);
    }
}
