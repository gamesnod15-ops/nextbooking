using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WhatsAppMessageConfiguration : IEntityTypeConfiguration<WhatsAppMessage>
{
    public void Configure(EntityTypeBuilder<WhatsAppMessage> builder)
    {
        builder.ToTable("whatsapp_messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.TenantId).IsRequired();
        builder.Property(m => m.ConversationId).IsRequired();
        builder.Property(m => m.Role).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(m => m.Text).HasMaxLength(4000).IsRequired();
        builder.Property(m => m.ExtractedDataJson).HasColumnType("jsonb");

        builder.HasIndex(m => m.ConversationId);
        builder.HasIndex(m => m.TenantId);
    }
}
