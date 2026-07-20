using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Loyalty.Commands.ToggleLoyaltyReward;

public record ToggleLoyaltyRewardCommand(Guid Id) : IRequest;

public sealed class ToggleLoyaltyRewardCommandHandler : IRequestHandler<ToggleLoyaltyRewardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ToggleLoyaltyRewardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ToggleLoyaltyRewardCommand request, CancellationToken cancellationToken)
    {
        var reward = await _context.LoyaltyRewards
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(LoyaltyReward), request.Id);

        if (reward.IsActive) reward.Deactivate();
        else reward.Activate();

        await _context.SaveChangesAsync(cancellationToken);
    }
}
