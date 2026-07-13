using MediatR;
using Microsoft.EntityFrameworkCore;
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

        _context.Services.Remove(service);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
