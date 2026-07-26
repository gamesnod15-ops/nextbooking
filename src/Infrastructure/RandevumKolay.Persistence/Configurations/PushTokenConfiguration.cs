using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class PushTokenConfiguration : IEntityTypeConfiguration<PushToken>
{
    public void Configure(EntityTypeBuilder<PushToken> builder)
    {
        builder.ToTable("push_tokens");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.DeviceId).IsRequired().HasMaxLength(64);
        builder.Property(p => p.Token).IsRequired().HasMaxLength(256);
        builder.Property(p => p.Platform).IsRequired().HasMaxLength(32);

        // One registration per install; re-registering refreshes the row.
        builder.HasIndex(p => p.DeviceId).IsUnique();
        builder.HasIndex(p => p.UserId);
    }
}
