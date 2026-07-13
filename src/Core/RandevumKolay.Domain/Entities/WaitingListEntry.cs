using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum WaitingListStatus { Waiting, Notified, Confirmed, Booked, Cancelled }

public class WaitingListEntry : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string? CustomerPhone { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? EmployeeId { get; private set; }
    public DateOnly? PreferredDate { get; private set; }
    public TimeOnly? PreferredTime { get; private set; }
    public WaitingListStatus Status { get; private set; } = WaitingListStatus.Waiting;
    public string? Notes { get; private set; }
    public DateTimeOffset? NotifiedAt { get; private set; }

    private WaitingListEntry() { }

    public static WaitingListEntry Create(
        Guid tenantId,
        Guid businessId,
        string customerName,
        string? customerPhone = null,
        Guid? serviceId = null,
        Guid? employeeId = null,
        DateOnly? preferredDate = null,
        TimeOnly? preferredTime = null,
        string? notes = null)
    {
        return new WaitingListEntry
        {
            TenantId = tenantId,
            BusinessId = businessId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            ServiceId = serviceId,
            EmployeeId = employeeId,
            PreferredDate = preferredDate,
            PreferredTime = preferredTime,
            Notes = notes,
            Status = WaitingListStatus.Waiting,
        };
    }

    public void Notify() { Status = WaitingListStatus.Notified; NotifiedAt = DateTimeOffset.UtcNow; }
    public void Confirm() => Status = WaitingListStatus.Confirmed;
    public void Book() => Status = WaitingListStatus.Booked;
    public void Cancel() => Status = WaitingListStatus.Cancelled;
}
