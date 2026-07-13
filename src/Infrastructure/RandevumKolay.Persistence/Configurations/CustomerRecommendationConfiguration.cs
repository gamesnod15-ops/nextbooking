using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class CustomerRecommendationConfiguration : IEntityTypeConfiguration<CustomerRecommendation>
{
    public void Configure(EntityTypeBuilder<CustomerRecommendation> builder)
    {
        builder.ToTable("customer_recommendations");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TenantId).IsRequired();
        builder.Property(r => r.CustomerId).IsRequired();
        builder.Property(r => r.RecommendationType).IsRequired();
        builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(500);
        builder.Property(r => r.RelevanceScore).HasPrecision(5, 4).IsRequired();
        builder.Property(r => r.Reason).HasMaxLength(500);

        builder.HasOne(r => r.Customer)
            .WithMany()
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.RecommendedService)
            .WithMany()
            .HasForeignKey(r => r.RecommendedServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.RecommendedProduct)
            .WithMany()
            .HasForeignKey(r => r.RecommendedProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.CustomerId);
        builder.HasIndex(r => r.RecommendationType);
        builder.HasIndex(r => new { r.CustomerId, r.RecommendationType, r.RelevanceScore });
    }
}
