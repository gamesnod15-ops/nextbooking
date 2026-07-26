using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class ClientErrorLogConfiguration : IEntityTypeConfiguration<ClientErrorLog>
{
    public void Configure(EntityTypeBuilder<ClientErrorLog> builder)
    {
        builder.ToTable("client_error_logs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Message).IsRequired().HasMaxLength(500);
        builder.Property(e => e.Stack).HasMaxLength(4000);
        builder.Property(e => e.ComponentStack).HasMaxLength(2000);
        builder.Property(e => e.Scope).HasMaxLength(100);
        builder.Property(e => e.Platform).IsRequired().HasMaxLength(32);
        builder.Property(e => e.OsVersion).HasMaxLength(32);
        builder.Property(e => e.AppVersion).HasMaxLength(32);
        builder.Property(e => e.AppEnv).HasMaxLength(32);
        builder.Property(e => e.DeviceId).HasMaxLength(64);

        // Newest-first is the only way these are ever read.
        builder.HasIndex(e => e.CreatedAt);
    }
}
