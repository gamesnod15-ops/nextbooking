using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyOverview;

public record GetLoyaltyOverviewQuery : IRequest<LoyaltyOverviewDto>;

public record LoyaltyOverviewDto(
    int TotalMembers,
    int TotalPointsDistributed,
    int AveragePoints,
    int TotalRedemptions,
    List<TierDistributionDto> TierDistribution,
    List<TopMemberDto> TopMembers);

public record TierDistributionDto(Guid TierId, string TierName, string Color, string IconName, int Count);

public record TopMemberDto(Guid MemberId, string Name, int Points, int Visits, Guid TierId, string TierName);

public sealed class GetLoyaltyOverviewQueryHandler : IRequestHandler<GetLoyaltyOverviewQuery, LoyaltyOverviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetLoyaltyOverviewQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<LoyaltyOverviewDto> Handle(GetLoyaltyOverviewQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var tiers = await LoyaltyTierHelper.GetOrSeedTiersAsync(_context, tenantId, cancellationToken);

        var members = await _context.LoyaltyMembers
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .Join(_context.Customers, m => m.CustomerId, c => c.Id, (m, c) => new { m.Id, c.Name, m.Points, c.TotalVisits })
            .ToListAsync(cancellationToken);

        var totalRedemptions = await _context.LoyaltyRedemptions
            .Where(r => r.TenantId == tenantId)
            .CountAsync(cancellationToken);

        var totalPoints = members.Sum(m => m.Points);
        var avgPoints = members.Count == 0 ? 0 : (int)Math.Round((double)totalPoints / members.Count);

        var tierDistribution = tiers
            .OrderBy(t => t.SortOrder)
            .Select(t => new TierDistributionDto(
                t.Id, t.Name, t.Color, t.IconName,
                members.Count(m => LoyaltyTierHelper.CurrentTier(tiers, m.Points).Id == t.Id)))
            .ToList();

        var topMembers = members
            .OrderByDescending(m => m.Points)
            .Take(5)
            .Select(m =>
            {
                var tier = LoyaltyTierHelper.CurrentTier(tiers, m.Points);
                return new TopMemberDto(m.Id, m.Name, m.Points, m.TotalVisits, tier.Id, tier.Name);
            })
            .ToList();

        return new LoyaltyOverviewDto(members.Count, totalPoints, avgPoints, totalRedemptions, tierDistribution, topMembers);
    }
}
