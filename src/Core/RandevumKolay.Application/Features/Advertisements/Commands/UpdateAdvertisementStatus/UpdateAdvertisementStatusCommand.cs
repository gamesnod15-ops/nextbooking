using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Advertisements.Commands.UpdateAdvertisementStatus;

public record UpdateAdvertisementStatusCommand(Guid Id, AdStatus Status) : IRequest;

public sealed class UpdateAdvertisementStatusCommandHandler : IRequestHandler<UpdateAdvertisementStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateAdvertisementStatusCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateAdvertisementStatusCommand request, CancellationToken cancellationToken)
    {
        var ad = await _context.Advertisements
            .FirstOrDefaultAsync(
                a => a.Id == request.Id && a.TenantId == _tenantService.TenantId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Advertisement {request.Id} not found.");

        ad.UpdateStatus(request.Status);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
