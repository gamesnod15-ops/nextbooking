using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Schedule : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public bool IsActive { get; private set; } = true;

    private Schedule() { }

    public static Schedule Create(
        Guid tenantId,
        Guid employeeId,
        DayOfWeek dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime)
    {
        if (endTime <= startTime)
            throw new ArgumentException("End time must be after start time.");

        return new Schedule
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime
        };
    }

    public void Update(TimeOnly startTime, TimeOnly endTime, bool isActive)
    {
        StartTime = startTime;
        EndTime = endTime;
        IsActive = isActive;
    }
}
