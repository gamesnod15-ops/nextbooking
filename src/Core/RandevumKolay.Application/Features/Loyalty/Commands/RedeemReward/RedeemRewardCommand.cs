using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Loyalty.Commands.RedeemReward;

public record RedeemRewardCommand(Guid MemberId, Guid RewardId) : IRequest;

public sealed class RedeemRewardCommandHandler : IRequestHandler<RedeemRewardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public RedeemRewardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(RedeemRewardCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;

        var member = await _context.LoyaltyMembers
            .FirstOrDefaultAsync(m => m.Id == request.MemberId && m.TenantId == tenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(LoyaltyMember), request.MemberId);

        var reward = await _context.LoyaltyRewards
            .FirstOrDefaultAsync(r => r.Id == request.RewardId && r.TenantId == tenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(LoyaltyReward), request.RewardId);

        if (!reward.IsActive)
            throw new Common.Exceptions.ValidationException("Bu ödül artık aktif değil.");

        if (member.Points < reward.PointCost)
            throw new ConflictException("Yetersiz puan bakiyesi.");

        member.RedeemPoints(reward.PointCost);
        reward.IncrementRedeemCount();

        _context.LoyaltyRedemptions.Add(
            LoyaltyRedemption.Create(tenantId, member.Id, reward.Id, reward.PointCost));

        await _context.SaveChangesAsync(cancellationToken);
    }
}
