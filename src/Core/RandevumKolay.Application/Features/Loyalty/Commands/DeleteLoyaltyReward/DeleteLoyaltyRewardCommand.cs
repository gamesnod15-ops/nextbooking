using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Loyalty.Commands.DeleteLoyaltyReward;

public record DeleteLoyaltyRewardCommand(Guid Id) : IRequest;

public sealed class DeleteLoyaltyRewardCommandHandler : IRequestHandler<DeleteLoyaltyRewardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteLoyaltyRewardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteLoyaltyRewardCommand request, CancellationToken cancellationToken)
    {
        var reward = await _context.LoyaltyRewards
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(LoyaltyReward), request.Id);

        _context.LoyaltyRewards.Remove(reward);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
