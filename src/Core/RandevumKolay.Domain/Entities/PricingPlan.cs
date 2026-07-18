using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// A marketing pricing-page card (e.g. "Başlangıç ₺299/ay") that the manager
/// panel authors. Distinct from <see cref="Package"/> (a business's own
/// service bundle sold to its customers) and from <see cref="Tenant.Plan"/>
/// (the internal plan key a tenant is actually on) — <see cref="PlanKey"/>
/// optionally links a pricing card to that internal key so a "buy" click can
/// be wired to the real signup/upgrade flow.
/// </summary>
public class PricingPlan : AuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string BadgeLabel { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal? Price { get; private set; }
    public bool IsCustomPricing { get; private set; }
    public string ButtonText { get; private set; } = string.Empty;
    public List<string> Features { get; private set; } = new();
    public bool IsHighlighted { get; private set; }
    public string? HighlightLabel { get; private set; }
    public string? PlanKey { get; private set; }
    public bool IsActive { get; private set; } = true;

    private PricingPlan() { }

    public static PricingPlan Create(
        string name,
        string badgeLabel,
        string description,
        decimal? price,
        bool isCustomPricing,
        string buttonText,
        List<string> features,
        bool isHighlighted,
        string? highlightLabel,
        string? planKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(buttonText);

        return new PricingPlan
        {
            Name = name,
            BadgeLabel = badgeLabel,
            Description = description,
            Price = isCustomPricing ? null : price,
            IsCustomPricing = isCustomPricing,
            ButtonText = buttonText,
            Features = features,
            IsHighlighted = isHighlighted,
            HighlightLabel = highlightLabel,
            PlanKey = planKey,
        };
    }

    public void Update(
        string name,
        string badgeLabel,
        string description,
        decimal? price,
        bool isCustomPricing,
        string buttonText,
        List<string> features,
        bool isHighlighted,
        string? highlightLabel,
        string? planKey)
    {
        Name = name;
        BadgeLabel = badgeLabel;
        Description = description;
        Price = isCustomPricing ? null : price;
        IsCustomPricing = isCustomPricing;
        ButtonText = buttonText;
        Features = features;
        IsHighlighted = isHighlighted;
        HighlightLabel = highlightLabel;
        PlanKey = planKey;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
