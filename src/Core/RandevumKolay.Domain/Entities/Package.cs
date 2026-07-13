using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Package : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public decimal? OriginalPrice { get; private set; }
    public int ValidityDays { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? ImageUrl { get; private set; }
    public List<PackageItem> Items { get; private set; } = new();

    private Package() { }

    public static Package Create(
        Guid tenantId,
        string name,
        decimal price,
        int validityDays,
        string? description = null,
        decimal? originalPrice = null)
    {
        return new Package
        {
            TenantId = tenantId,
            Name = name,
            Price = price,
            ValidityDays = validityDays,
            Description = description,
            OriginalPrice = originalPrice
        };
    }

    public void Update(string name, string? description, decimal price,
        decimal? originalPrice, int validityDays, bool isActive)
    {
        Name = name;
        Description = description;
        Price = price;
        OriginalPrice = originalPrice;
        ValidityDays = validityDays;
        IsActive = isActive;
    }

    public void SetImage(string imageUrl) => ImageUrl = imageUrl;

    public void SetItems(List<PackageItem> items) => Items = items;
}

public class PackageItem
{
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}
