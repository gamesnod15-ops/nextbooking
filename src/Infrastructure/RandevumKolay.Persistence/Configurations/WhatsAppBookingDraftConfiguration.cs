using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WhatsAppBookingDraftConfiguration : IEntityTypeConfiguration<WhatsAppBookingDraft>
{
    public void Configure(EntityTypeBuilder<WhatsAppBookingDraft> builder)
    {
        builder.ToTable("whatsapp_booking_drafts");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.TenantId).IsRequired();
        builder.Property(d => d.ConversationId).IsRequired();
        builder.Property(d => d.ServiceId).IsRequired();
        builder.Property(d => d.ServiceName).HasMaxLength(200).IsRequired();
        builder.Property(d => d.Date).IsRequired();
        builder.Property(d => d.Time).IsRequired();
        builder.Property(d => d.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(d => d.CustomerPhone).HasMaxLength(32).IsRequired();
        builder.Property(d => d.CustomerEmail).HasMaxLength(200);
        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(d => d.RejectionReason).HasMaxLength(500);

        builder.HasOne(d => d.Conversation)
            .WithMany()
            .HasForeignKey(d => d.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.TenantId);
        builder.HasIndex(d => d.Status);
        builder.HasIndex(d => d.ConversationId);
    }
}
