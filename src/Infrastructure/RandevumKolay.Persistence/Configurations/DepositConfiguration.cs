using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class DepositConfiguration : IEntityTypeConfiguration<Deposit>
{
    public void Configure(EntityTypeBuilder<Deposit> builder)
    {
        builder.ToTable("deposits");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.TenantId).IsRequired();
        builder.Property(d => d.AppointmentId).IsRequired();
        builder.Property(d => d.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(d => d.Currency).HasMaxLength(5).IsRequired().HasDefaultValue("TRY");
        builder.Property(d => d.Status).IsRequired();
        builder.Property(d => d.PaymentMethod).HasMaxLength(50).IsRequired();
        builder.Property(d => d.PaymentProvider).HasMaxLength(100);
        builder.Property(d => d.ProviderPaymentId).HasMaxLength(500);
        builder.Property(d => d.Notes).HasMaxLength(500);

        builder.HasOne(d => d.Appointment)
            .WithMany()
            .HasForeignKey(d => d.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.TenantId);
        builder.HasIndex(d => d.AppointmentId);
        builder.HasIndex(d => d.Status);
    }
}
