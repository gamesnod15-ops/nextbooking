using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum PurchaseStatus { Active, Expired, Cancelled }

public class ProductPurchase : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string ProductType { get; private set; } = string.Empty;
    public string PlanName { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public PurchaseStatus Status { get; private set; } = PurchaseStatus.Active;
    public DateTimeOffset? StartDate { get; private set; }
    public DateTimeOffset? EndDate { get; private set; }
    public Guid? ReceivableId { get; private set; }
    public Receivable? Receivable { get; private set; }

    private ProductPurchase() { }

    public static ProductPurchase Create(
        Guid tenantId, string productType, string planName, decimal amount,
        Guid? receivableId = null)
    {
        return new ProductPurchase
        {
            TenantId = tenantId,
            ProductType = productType,
            PlanName = planName,
            Amount = amount,
            Status = PurchaseStatus.Active,
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddMonths(1),
            ReceivableId = receivableId,
        };
    }

    public void Cancel()
    {
        Status = PurchaseStatus.Cancelled;
    }
}
