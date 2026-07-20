using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Events;

namespace RandevumKolay.Domain.Entities;

public class Appointment : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid ServiceId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public Guid CustomerId { get; private set; }
    public DateTimeOffset StartTime { get; private set; }
    public DateTimeOffset EndTime { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public decimal Price { get; private set; }
    public string? Notes { get; private set; }
    public string? CancellationReason { get; private set; }
    public string Source { get; private set; } = "web";
    public bool ReminderSent { get; private set; }

    // Navigation properties
    public Service? Service { get; private set; }
    public Employee? Employee { get; private set; }
    public Customer? Customer { get; private set; }
    public Payment? Payment { get; private set; }

    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    public void ClearDomainEvents() => _domainEvents.Clear();

    private Appointment() { }

    public static Appointment Create(
        Guid tenantId,
        Guid businessId,
        Guid serviceId,
        Guid employeeId,
        Guid customerId,
        DateTimeOffset startTime,
        DateTimeOffset endTime,
        decimal price,
        string? notes = null,
        string source = "web")
    {
        var appointment = new Appointment
        {
            TenantId = tenantId,
            BusinessId = businessId,
            ServiceId = serviceId,
            EmployeeId = employeeId,
            CustomerId = customerId,
            StartTime = startTime,
            EndTime = endTime,
            Status = AppointmentStatus.Pending,
            Price = price,
            Notes = notes,
            Source = source
        };

        appointment._domainEvents.Add(new AppointmentCreatedEvent(appointment));
        return appointment;
    }

    public void Confirm()
    {
        if (Status != AppointmentStatus.Pending)
            throw new InvalidOperationException("Only pending appointments can be confirmed.");

        Status = AppointmentStatus.Confirmed;
        _domainEvents.Add(new AppointmentConfirmedEvent(this));
    }

    public void Cancel(string reason)
    {
        if (Status == AppointmentStatus.Completed)
            throw new InvalidOperationException("Completed appointments cannot be cancelled.");

        Status = AppointmentStatus.Cancelled;
        CancellationReason = reason;
        _domainEvents.Add(new AppointmentCancelledEvent(this, reason));
    }

    public void Complete()
    {
        if (Status != AppointmentStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed appointments can be completed.");

        Status = AppointmentStatus.Completed;
        _domainEvents.Add(new AppointmentCompletedEvent(this));
    }

    public void MarkReminderSent() => ReminderSent = true;

    public void Reschedule(DateTimeOffset newStart, DateTimeOffset newEnd)
    {
        if (Status == AppointmentStatus.Cancelled || Status == AppointmentStatus.Completed)
            throw new InvalidOperationException("Cannot reschedule cancelled or completed appointments.");

        var oldStart = StartTime;
        StartTime = newStart;
        EndTime = newEnd;
        _domainEvents.Add(new AppointmentRescheduledEvent(this, oldStart));
    }
}

public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    Completed = 2,
    Cancelled = 3,
    NoShow = 4
}
