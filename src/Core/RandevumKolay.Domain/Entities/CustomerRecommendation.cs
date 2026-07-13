using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class CustomerRecommendation : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid CustomerId { get; private set; }
    public RecommendationType RecommendationType { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public Guid? RecommendedServiceId { get; private set; }
    public Guid? RecommendedProductId { get; private set; }
    public decimal RelevanceScore { get; private set; }
    public string? Reason { get; private set; }
    public bool IsViewed { get; private set; }
    public bool IsClicked { get; private set; }
    public bool IsConverted { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }

    public Customer? Customer { get; private set; }
    public Service? RecommendedService { get; private set; }
    public Product? RecommendedProduct { get; private set; }

    private CustomerRecommendation() { }

    public static CustomerRecommendation Create(
        Guid tenantId,
        Guid customerId,
        RecommendationType type,
        string title,
        string? description,
        decimal relevanceScore,
        string? reason = null,
        Guid? serviceId = null,
        Guid? productId = null,
        DateTimeOffset? expiresAt = null)
    {
        return new CustomerRecommendation
        {
            TenantId = tenantId,
            CustomerId = customerId,
            RecommendationType = type,
            Title = title,
            Description = description,
            RecommendedServiceId = serviceId,
            RecommendedProductId = productId,
            RelevanceScore = relevanceScore,
            Reason = reason,
            ExpiresAt = expiresAt
        };
    }

    public void MarkAsViewed() => IsViewed = true;
    public void MarkAsClicked() => IsClicked = true;
    public void MarkAsConverted() => IsConverted = true;
}
