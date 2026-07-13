using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class NoShowPredictionConfiguration : IEntityTypeConfiguration<NoShowPrediction>
{
    public void Configure(EntityTypeBuilder<NoShowPrediction> builder)
    {
        builder.ToTable("no_show_predictions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.TenantId).IsRequired();
        builder.Property(p => p.AppointmentId).IsRequired();
        builder.Property(p => p.CustomerId).IsRequired();
        builder.Property(p => p.Probability).HasPrecision(5, 4).IsRequired();
        builder.Property(p => p.RiskLevel).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Factors).HasMaxLength(1000);
        builder.Property(p => p.RecommendedDepositAmount).HasPrecision(18, 2);
        builder.Property(p => p.PredictedAt).IsRequired();

        builder.HasOne(p => p.Appointment)
            .WithMany()
            .HasForeignKey(p => p.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Customer)
            .WithMany()
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.AppointmentId).IsUnique();
        builder.HasIndex(p => p.RiskLevel);
    }
}
