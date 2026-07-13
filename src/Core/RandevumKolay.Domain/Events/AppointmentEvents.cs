using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Domain.Events;

public sealed record AppointmentCreatedEvent(Appointment Appointment) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}

public sealed record AppointmentConfirmedEvent(Appointment Appointment) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}

public sealed record AppointmentCancelledEvent(Appointment Appointment, string Reason) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}

public sealed record AppointmentRescheduledEvent(
    Appointment Appointment,
    DateTimeOffset PreviousStartTime) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}

public sealed record AppointmentCompletedEvent(Appointment Appointment) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
