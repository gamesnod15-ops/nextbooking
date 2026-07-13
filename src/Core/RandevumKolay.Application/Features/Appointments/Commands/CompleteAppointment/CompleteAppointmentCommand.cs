using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Commands.CompleteAppointment;

public record CompleteAppointmentCommand(Guid Id) : IRequest;

public sealed class CompleteAppointmentCommandHandler : IRequestHandler<CompleteAppointmentCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CompleteAppointmentCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(CompleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Appointment), request.Id);

        appointment.Complete();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
