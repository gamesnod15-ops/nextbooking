using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Commands.CancelAppointment;

public record CancelAppointmentCommand(Guid AppointmentId, string Reason) : IRequest;

public sealed class CancelAppointmentCommandHandler
    : IRequestHandler<CancelAppointmentCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly ICurrentUserService _userService;
    private readonly IPublisher _publisher;

    public CancelAppointmentCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        ICurrentUserService userService,
        IPublisher publisher)
    {
        _context = context;
        _tenantService = tenantService;
        _userService = userService;
        _publisher = publisher;
    }

    public async Task Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _context.Appointments
            .Where(a => a.Id == request.AppointmentId)
            .Where(a => _tenantService.TenantIdOrNull == null || a.TenantId == _tenantService.TenantIdOrNull)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(Appointment), request.AppointmentId);

        appointment.Cancel(request.Reason);

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var domainEvent in appointment.DomainEvents)
            await _publisher.Publish(domainEvent, cancellationToken);

        appointment.ClearDomainEvents();
    }
}
