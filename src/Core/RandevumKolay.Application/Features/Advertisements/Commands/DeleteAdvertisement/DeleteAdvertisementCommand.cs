using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Advertisements.Commands.DeleteAdvertisement;

public record DeleteAdvertisementCommand(Guid Id) : IRequest;

public sealed class DeleteAdvertisementCommandHandler : IRequestHandler<DeleteAdvertisementCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteAdvertisementCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteAdvertisementCommand request, CancellationToken cancellationToken)
    {
        var ad = await _context.Advertisements
            .FirstOrDefaultAsync(
                a => a.Id == request.Id && a.TenantId == _tenantService.TenantId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Advertisement {request.Id} not found.");

        _context.Advertisements.Remove(ad);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
