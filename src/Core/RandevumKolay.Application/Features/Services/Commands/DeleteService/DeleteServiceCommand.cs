using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Services.Commands.DeleteService;

public record DeleteServiceCommand(Guid Id) : IRequest;

public sealed class DeleteServiceCommandHandler : IRequestHandler<DeleteServiceCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteServiceCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Service {request.Id} not found.");

        // Appointments.ServiceId has DeleteBehavior.Restrict, so deleting a service
        // with appointment history throws an unhandled DbUpdateException that the
        // global middleware turns into a generic 500 ("An unexpected error occurred.").
        // Check up front and surface a clear, actionable message instead — this is
        // the common case in practice, since any service that has ever been booked
        // cannot be hard-deleted.
        var hasAppointments = await _context.Appointments
            .AnyAsync(a => a.ServiceId == service.Id, cancellationToken);

        if (hasAppointments)
        {
            throw new ConflictException(
                "Bu hizmetin randevu geçmişi bulunduğu için silinemez. Bunun yerine hizmeti pasif hale getirebilirsiniz.");
        }

        _context.Services.Remove(service);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
