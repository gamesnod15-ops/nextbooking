using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum QueueStatus { Waiting, InService, Completed, Cancelled, NoShow }

public class QueueItem : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public int QueueNumber { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string? CustomerPhone { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? EmployeeId { get; private set; }
    public QueueStatus Status { get; private set; } = QueueStatus.Waiting;
    public int EstimatedWaitMinutes { get; private set; }
    public DateTimeOffset? CalledAt { get; private set; }
    public string? Notes { get; private set; }

    private QueueItem() { }

    public static QueueItem Create(
        Guid tenantId,
        Guid businessId,
        int queueNumber,
        string customerName,
        string? customerPhone = null,
        Guid? serviceId = null,
        Guid? employeeId = null,
        int estimatedWaitMinutes = 0)
    {
        return new QueueItem
        {
            TenantId = tenantId,
            BusinessId = businessId,
            QueueNumber = queueNumber,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            ServiceId = serviceId,
            EmployeeId = employeeId,
            EstimatedWaitMinutes = estimatedWaitMinutes,
            Status = QueueStatus.Waiting,
        };
    }

    public void Call() { Status = QueueStatus.InService; CalledAt = DateTimeOffset.UtcNow; }
    public void Complete() => Status = QueueStatus.Completed;
    public void Cancel(string? notes = null) { Status = QueueStatus.Cancelled; Notes = notes; }
    public void UpdateEstimatedWait(int minutes) => EstimatedWaitMinutes = minutes;
}
