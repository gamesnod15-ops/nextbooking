using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class WinBackSendLog : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid RuleId { get; private set; }
    public DateTimeOffset SentAt { get; private set; }

    private WinBackSendLog() { }

    public static WinBackSendLog Create(Guid tenantId, Guid customerId, Guid ruleId)
    {
        return new WinBackSendLog
        {
            TenantId = tenantId,
            CustomerId = customerId,
            RuleId = ruleId,
            SentAt = DateTimeOffset.UtcNow,
        };
    }
}
