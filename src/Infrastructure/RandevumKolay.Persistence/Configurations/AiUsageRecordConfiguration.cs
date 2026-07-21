using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class AiUsageRecordConfiguration : IEntityTypeConfiguration<AiUsageRecord>
{
    public void Configure(EntityTypeBuilder<AiUsageRecord> builder)
    {
        builder.ToTable("ai_usage_records");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TenantId).IsRequired();
        builder.Property(r => r.PeriodStart).IsRequired();
        builder.Property(r => r.MessageCount).IsRequired();
        builder.Property(r => r.InputTokens).IsRequired();
        builder.Property(r => r.OutputTokens).IsRequired();
        builder.Property(r => r.EstimatedCostUsd).HasColumnType("decimal(10,4)").IsRequired();

        builder.HasIndex(r => new { r.TenantId, r.PeriodStart }).IsUnique();
    }
}
