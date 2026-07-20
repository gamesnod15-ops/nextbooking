using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyTiers;

public record GetLoyaltyTiersQuery : IRequest<List<LoyaltyTierDto>>;

public record LoyaltyTierDto(
    Guid Id,
    string Name,
    int MinPoints,
    decimal Multiplier,
    string Color,
    string IconName,
    List<string> Benefits,
    int SortOrder);

public sealed class GetLoyaltyTiersQueryHandler : IRequestHandler<GetLoyaltyTiersQuery, List<LoyaltyTierDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetLoyaltyTiersQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<LoyaltyTierDto>> Handle(GetLoyaltyTiersQuery request, CancellationToken cancellationToken)
    {
        var tiers = await LoyaltyTierHelper.GetOrSeedTiersAsync(_context, _tenantService.TenantId, cancellationToken);

        return tiers
            .OrderBy(t => t.SortOrder)
            .Select(t => new LoyaltyTierDto(t.Id, t.Name, t.MinPoints, t.Multiplier, t.Color, t.IconName, t.Benefits, t.SortOrder))
            .ToList();
    }
}
