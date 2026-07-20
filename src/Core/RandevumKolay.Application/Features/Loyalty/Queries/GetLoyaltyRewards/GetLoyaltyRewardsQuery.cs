using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyRewards;

public record GetLoyaltyRewardsQuery : IRequest<List<LoyaltyRewardDto>>;

public record LoyaltyRewardDto(
    Guid Id,
    string Name,
    string? Description,
    int PointCost,
    LoyaltyRewardCategory Category,
    bool IsActive,
    int RedeemCount);

public sealed class GetLoyaltyRewardsQueryHandler : IRequestHandler<GetLoyaltyRewardsQuery, List<LoyaltyRewardDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetLoyaltyRewardsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<LoyaltyRewardDto>> Handle(GetLoyaltyRewardsQuery request, CancellationToken cancellationToken)
    {
        return await _context.LoyaltyRewards
            .AsNoTracking()
            .Where(r => r.TenantId == _tenantService.TenantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new LoyaltyRewardDto(r.Id, r.Name, r.Description, r.PointCost, r.Category, r.IsActive, r.RedeemCount))
            .ToListAsync(cancellationToken);
    }
}
