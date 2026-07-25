using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("favorites");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.BusinessId).IsRequired();

        builder.HasOne(f => f.Business)
            .WithMany()
            .HasForeignKey(f => f.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => new { f.UserId, f.BusinessId })
            .IsUnique()
            .HasFilter("\"user_id\" IS NOT NULL");

        builder.HasIndex(f => new { f.DeviceId, f.BusinessId })
            .IsUnique()
            .HasFilter("\"device_id\" IS NOT NULL");
    }
}
