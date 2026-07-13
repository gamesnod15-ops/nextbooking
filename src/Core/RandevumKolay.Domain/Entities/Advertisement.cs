using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum AdStatus { Active, Pending, Expired, Rejected, Paused }
public enum AdPackageType { BasicBoost, ProfessionalBoost, PremiumSpotlight }
public enum AdTargetCategory { All, Hair, Beauty, Wellness, Fitness, Healthcare, Nail, Massage, Other }

public class Advertisement : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public AdPackageType PackageType { get; private set; }
    public AdTargetCategory TargetCategory { get; private set; }
    public string? TargetLocation { get; private set; }
    public decimal Budget { get; private set; }
    public DateTimeOffset StartDate { get; private set; }
    public DateTimeOffset EndDate { get; private set; }
    public AdStatus Status { get; private set; } = AdStatus.Pending;
    public int Impressions { get; private set; }
    public int Clicks { get; private set; }
    public int Conversions { get; private set; }

    private Advertisement() { }

    public static Advertisement Create(
        Guid tenantId,
        string title,
        AdPackageType packageType,
        AdTargetCategory targetCategory,
        decimal budget,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        string? description = null,
        string? targetLocation = null)
    {
        var normalizedStart = startDate.ToUniversalTime();
        var normalizedEnd = endDate.ToUniversalTime();

        if (normalizedEnd <= normalizedStart)
            throw new ArgumentException("End date must be after start date.");

        if (budget <= 0)
            throw new ArgumentException("Budget must be greater than zero.");

        return new Advertisement
        {
            TenantId = tenantId,
            Title = title,
            PackageType = packageType,
            TargetCategory = targetCategory,
            Budget = budget,
            StartDate = normalizedStart,
            EndDate = normalizedEnd,
            Description = description,
            TargetLocation = targetLocation,
        };
    }

    public void UpdateStatus(AdStatus status) => Status = status;

    public void RecordImpression() => Impressions++;
    public void RecordClick() => Clicks++;
    public void RecordConversion() => Conversions++;

    public void AddMetrics(int impressions, int clicks, int conversions)
    {
        Impressions += impressions;
        Clicks += clicks;
        Conversions += conversions;
    }
}
