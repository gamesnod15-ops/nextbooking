using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.PricingPlans;

/// <summary>Public pricing-page data — the plans currently assigned to the
/// platform's 4 fixed display slots, in slot order. No auth required.</summary>
public record GetPublicPricingPlansQuery : IRequest<List<PublicPricingPlanDto>>;

public record PublicPricingPlanDto(
    string Name,
    string BadgeLabel,
    string Description,
    decimal? Price,
    bool IsCustomPricing,
    string ButtonText,
    List<string> Features,
    bool IsHighlighted,
    string? HighlightLabel,
    string? PlanKey);

public sealed class GetPublicPricingPlansQueryHandler : IRequestHandler<GetPublicPricingPlansQuery, List<PublicPricingPlanDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPublicPricingPlansQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<PublicPricingPlanDto>> Handle(GetPublicPricingPlansQuery request, CancellationToken cancellationToken)
    {
        var slots = await _context.PricingPlanSlots.AsNoTracking()
            .Where(s => s.PricingPlanId != null)
            .OrderBy(s => s.SlotNumber)
            .Select(s => s.PricingPlanId!.Value)
            .ToListAsync(cancellationToken);

        var plans = await _context.PricingPlans.AsNoTracking()
            .Where(p => slots.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        return slots
            .Where(plans.ContainsKey)
            .Select(id => plans[id])
            .Select(p => new PublicPricingPlanDto(
                p.Name, p.BadgeLabel, p.Description, p.Price, p.IsCustomPricing,
                p.ButtonText, p.Features, p.IsHighlighted, p.HighlightLabel, p.PlanKey))
            .ToList();
    }
}
