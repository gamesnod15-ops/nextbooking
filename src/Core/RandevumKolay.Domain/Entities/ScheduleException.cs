using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class ScheduleException : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DateOnly Date { get; private set; }
    public bool IsClosed { get; private set; }
    public TimeOnly? StartTime { get; private set; }
    public TimeOnly? EndTime { get; private set; }
    public string? Reason { get; private set; }

    private ScheduleException() { }

    public static ScheduleException CreateClosure(
        Guid tenantId, Guid employeeId, DateOnly date, string? reason = null)
    {
        return new ScheduleException
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            Date = date,
            IsClosed = true,
            Reason = reason
        };
    }

    public static ScheduleException CreateSpecialHours(
        Guid tenantId, Guid employeeId, DateOnly date,
        TimeOnly startTime, TimeOnly endTime, string? reason = null)
    {
        return new ScheduleException
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            Date = date,
            IsClosed = false,
            StartTime = startTime,
            EndTime = endTime,
            Reason = reason
        };
    }
}
