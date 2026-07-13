using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum DiscountType { Percentage, FixedAmount }
public enum CampaignStatus { Draft, Active, Paused, Ended }

public class Campaign : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public DateTimeOffset StartDate { get; private set; }
    public DateTimeOffset EndDate { get; private set; }
    public CampaignStatus Status { get; private set; } = CampaignStatus.Draft;
    public int? UsageLimit { get; private set; }
    public int UsageCount { get; private set; }
    public List<Guid> ApplicableServiceIds { get; private set; } = new();

    private Campaign() { }

    public static Campaign Create(
        Guid tenantId,
        string name,
        DiscountType discountType,
        decimal discountValue,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        string? description = null,
        int? usageLimit = null)
    {
        var normalizedStartDate = startDate.ToUniversalTime();
        var normalizedEndDate = endDate.ToUniversalTime();

        if (normalizedEndDate <= normalizedStartDate)
            throw new ArgumentException("End date must be after start date.");

        return new Campaign
        {
            TenantId = tenantId,
            Name = name,
            DiscountType = discountType,
            DiscountValue = discountValue,
            StartDate = normalizedStartDate,
            EndDate = normalizedEndDate,
            Description = description,
            UsageLimit = usageLimit
        };
    }

    public void Update(string name, string? description, DiscountType discountType,
        decimal discountValue, DateTimeOffset startDate, DateTimeOffset endDate, int? usageLimit)
    {
        var normalizedStartDate = startDate.ToUniversalTime();
        var normalizedEndDate = endDate.ToUniversalTime();

        if (normalizedEndDate <= normalizedStartDate)
            throw new ArgumentException("End date must be after start date.");

        Name = name;
        Description = description;
        DiscountType = discountType;
        DiscountValue = discountValue;
        StartDate = normalizedStartDate;
        EndDate = normalizedEndDate;
        UsageLimit = usageLimit;
    }

    public void SetStatus(CampaignStatus status) => Status = status;
    public void SetApplicableServices(List<Guid> serviceIds) => ApplicableServiceIds = serviceIds;
    public void IncrementUsage() => UsageCount++;
}
