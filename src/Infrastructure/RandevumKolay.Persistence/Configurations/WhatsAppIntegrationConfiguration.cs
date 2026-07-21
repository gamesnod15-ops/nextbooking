using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WhatsAppIntegrationConfiguration : IEntityTypeConfiguration<WhatsAppIntegration>
{
    public void Configure(EntityTypeBuilder<WhatsAppIntegration> builder)
    {
        builder.ToTable("whatsapp_integrations");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.TenantId).IsRequired();
        builder.Property(i => i.PhoneNumberId).HasMaxLength(100);
        builder.Property(i => i.AccessToken).HasMaxLength(2000);
        builder.Property(i => i.IsConnected).IsRequired();

        builder.HasIndex(i => i.TenantId).IsUnique();
    }
}
