using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WinBackSendLogConfiguration : IEntityTypeConfiguration<WinBackSendLog>
{
    public void Configure(EntityTypeBuilder<WinBackSendLog> builder)
    {
        builder.ToTable("win_back_send_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.TenantId).IsRequired();
        builder.Property(l => l.CustomerId).IsRequired();
        builder.Property(l => l.RuleId).IsRequired();
        builder.Property(l => l.SentAt).IsRequired();

        builder.HasIndex(l => l.TenantId);
        builder.HasIndex(l => new { l.CustomerId, l.RuleId });
    }
}
