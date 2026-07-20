using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class LoyaltyTier : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int MinPoints { get; private set; }
    public decimal Multiplier { get; private set; }
    public string Color { get; private set; } = string.Empty;
    public string IconName { get; private set; } = string.Empty;
    public List<string> Benefits { get; private set; } = new();
    public int SortOrder { get; private set; }

    private LoyaltyTier() { }

    public static LoyaltyTier Create(
        Guid tenantId,
        string name,
        int minPoints,
        decimal multiplier,
        string color,
        string iconName,
        List<string> benefits,
        int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new LoyaltyTier
        {
            TenantId = tenantId,
            Name = name,
            MinPoints = minPoints,
            Multiplier = multiplier,
            Color = color,
            IconName = iconName,
            Benefits = benefits,
            SortOrder = sortOrder
        };
    }

    public static List<LoyaltyTier> CreateDefaults(Guid tenantId) => new()
    {
        Create(tenantId, "Bronz", 0, 1m, "text-amber-700 bg-amber-50 border-amber-200", "Star",
            new List<string> { "Her 1 TL = 1 puan", "%5 doğum günü indirimi" }, 0),
        Create(tenantId, "Gümüş", 500, 1.5m, "text-gray-500 bg-gray-50 border-gray-200", "Zap",
            new List<string> { "Her 1 TL = 1.5 puan", "%10 doğum günü indirimi", "Öncelikli randevu" }, 1),
        Create(tenantId, "Altın", 1500, 2m, "text-yellow-600 bg-yellow-50 border-yellow-200", "Crown",
            new List<string> { "Her 1 TL = 2 puan", "%15 doğum günü indirimi", "Öncelikli randevu", "Ücretsiz ürün" }, 2),
        Create(tenantId, "Platin", 5000, 3m, "text-purple-600 bg-purple-50 border-purple-200", "Heart",
            new List<string> { "Her 1 TL = 3 puan", "%20 doğum günü indirimi", "VIP randevu", "Aylık ücretsiz hizmet" }, 3),
    };
}
