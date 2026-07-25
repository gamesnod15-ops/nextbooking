using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Commands.CancelAppointmentByDevice;

/// <summary>
/// Lets a guest customer (no account) cancel an appointment they booked on
/// this device, verified by matching the appointment's stored DeviceId —
/// unguessable, so this can't be used to cancel someone else's appointment.
/// </summary>
public record CancelAppointmentByDeviceCommand(Guid AppointmentId, string DeviceId, string? Reason) : IRequest;

public sealed class CancelAppointmentByDeviceCommandHandler
    : IRequestHandler<CancelAppointmentByDeviceCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IPublisher _publisher;

    public CancelAppointmentByDeviceCommandHandler(IApplicationDbContext context, IPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
    }

    public async Task Handle(CancelAppointmentByDeviceCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            throw new NotFoundException(nameof(Appointment), request.AppointmentId);

        var appointment = await _context.Appointments
            .Where(a => a.Id == request.AppointmentId && a.DeviceId == request.DeviceId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(Appointment), request.AppointmentId);

        appointment.Cancel(request.Reason ?? "Müşteri tarafından iptal edildi");

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var domainEvent in appointment.DomainEvents)
            await _publisher.Publish(domainEvent, cancellationToken);

        appointment.ClearDomainEvents();
    }
}
