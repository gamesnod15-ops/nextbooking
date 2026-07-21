using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class WhatsAppConversationConfiguration : IEntityTypeConfiguration<WhatsAppConversation>
{
    public void Configure(EntityTypeBuilder<WhatsAppConversation> builder)
    {
        builder.ToTable("whatsapp_conversations");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.TenantId).IsRequired();
        builder.Property(c => c.CustomerPhone).HasMaxLength(32).IsRequired();
        builder.Property(c => c.CustomerName).HasMaxLength(200);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.LeadTier).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(c => c.EscalationReason).HasMaxLength(500);
        builder.Property(c => c.LastMessageAt).IsRequired();

        builder.Property(c => c.AutomationStep).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.PendingServiceName).HasMaxLength(200);
        builder.Property(c => c.PendingName).HasMaxLength(200);
        builder.Property(c => c.PendingPhone).HasMaxLength(32);

        builder.HasOne(c => c.Customer)
            .WithMany()
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => new { c.TenantId, c.CustomerPhone });
        builder.HasIndex(c => c.Status);
    }
}
