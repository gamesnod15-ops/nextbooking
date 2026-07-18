using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

/// <summary>Every pricing card an admin has authored — the candidate pool
/// that fixed display slots pick from.</summary>
public record GetPricingPlansQuery : IRequest<List<PricingPlanDto>>;

public record PricingPlanDto(
    Guid Id,
    string Name,
    string BadgeLabel,
    string Description,
    decimal? Price,
    bool IsCustomPricing,
    string ButtonText,
    List<string> Features,
    bool IsHighlighted,
    string? HighlightLabel,
    string? PlanKey,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed class GetPricingPlansQueryHandler : IRequestHandler<GetPricingPlansQuery, List<PricingPlanDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPricingPlansQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<PricingPlanDto>> Handle(GetPricingPlansQuery request, CancellationToken cancellationToken)
    {
        return await _context.PricingPlans.AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PricingPlanDto(
                p.Id, p.Name, p.BadgeLabel, p.Description, p.Price, p.IsCustomPricing,
                p.ButtonText, p.Features, p.IsHighlighted, p.HighlightLabel, p.PlanKey, p.IsActive, p.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
