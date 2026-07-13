using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Campaigns.Commands.DeleteCampaign;

public record DeleteCampaignCommand(Guid Id) : IRequest;

public sealed class DeleteCampaignCommandHandler : IRequestHandler<DeleteCampaignCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteCampaignCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteCampaignCommand request, CancellationToken cancellationToken)
    {
        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Campaign {request.Id} not found.");

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
