using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class WinBackRule : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public int DaysSinceLastVisit { get; private set; }
    public string MessageTemplate { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    private WinBackRule() { }

    public static WinBackRule Create(Guid tenantId, int daysSinceLastVisit, string messageTemplate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(messageTemplate);
        if (daysSinceLastVisit <= 0)
            throw new ArgumentOutOfRangeException(nameof(daysSinceLastVisit));

        return new WinBackRule
        {
            TenantId = tenantId,
            DaysSinceLastVisit = daysSinceLastVisit,
            MessageTemplate = messageTemplate,
        };
    }

    public void Update(int daysSinceLastVisit, string messageTemplate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(messageTemplate);
        if (daysSinceLastVisit <= 0)
            throw new ArgumentOutOfRangeException(nameof(daysSinceLastVisit));

        DaysSinceLastVisit = daysSinceLastVisit;
        MessageTemplate = messageTemplate;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}
