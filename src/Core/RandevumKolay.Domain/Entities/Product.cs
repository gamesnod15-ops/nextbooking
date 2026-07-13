using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Product : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Category { get; private set; }
    public string? Barcode { get; private set; }
    public decimal SalePrice { get; private set; }
    public decimal? CostPrice { get; private set; }
    public int StockQuantity { get; private set; }
    public int MinStockLevel { get; private set; } = 5;
    public string Unit { get; private set; } = "adet";
    public bool IsActive { get; private set; } = true;

    private Product() { }

    public static Product Create(
        Guid tenantId,
        string name,
        decimal salePrice,
        int stockQuantity,
        string? category = null,
        string? barcode = null,
        decimal? costPrice = null,
        int minStockLevel = 5,
        string unit = "adet",
        string? description = null)
    {
        return new Product
        {
            TenantId = tenantId,
            Name = name,
            SalePrice = salePrice,
            StockQuantity = stockQuantity,
            Category = category,
            Barcode = barcode,
            CostPrice = costPrice,
            MinStockLevel = minStockLevel,
            Unit = unit,
            Description = description
        };
    }

    public void Update(string name, decimal salePrice, int stockQuantity, string? category,
        string? barcode, decimal? costPrice, int minStockLevel, string unit, string? description)
    {
        Name = name;
        SalePrice = salePrice;
        StockQuantity = stockQuantity;
        Category = category;
        Barcode = barcode;
        CostPrice = costPrice;
        MinStockLevel = minStockLevel;
        Unit = unit;
        Description = description;
    }

    public void AdjustStock(int delta) => StockQuantity = Math.Max(0, StockQuantity + delta);
    public void SetActive(bool isActive) => IsActive = isActive;
}
