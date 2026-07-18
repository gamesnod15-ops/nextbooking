using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

/// <summary>The 4 fixed pricing-page display slots, each with the plan
/// currently assigned to it (if any).</summary>
public record GetPricingPlanSlotsQuery : IRequest<List<PricingPlanSlotDto>>;

public record PricingPlanSlotDto(Guid Id, int SlotNumber, PricingPlanDto? Plan);

public sealed class GetPricingPlanSlotsQueryHandler : IRequestHandler<GetPricingPlanSlotsQuery, List<PricingPlanSlotDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPricingPlanSlotsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<PricingPlanSlotDto>> Handle(GetPricingPlanSlotsQuery request, CancellationToken cancellationToken)
    {
        var slots = await _context.PricingPlanSlots.AsNoTracking()
            .OrderBy(s => s.SlotNumber)
            .ToListAsync(cancellationToken);

        var planIds = slots.Where(s => s.PricingPlanId.HasValue).Select(s => s.PricingPlanId!.Value).ToList();
        var plans = await _context.PricingPlans.AsNoTracking()
            .Where(p => planIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        return slots.Select(s =>
        {
            PricingPlanDto? planDto = null;
            if (s.PricingPlanId.HasValue && plans.TryGetValue(s.PricingPlanId.Value, out var p))
            {
                planDto = new PricingPlanDto(
                    p.Id, p.Name, p.BadgeLabel, p.Description, p.Price, p.IsCustomPricing,
                    p.ButtonText, p.Features, p.IsHighlighted, p.HighlightLabel, p.PlanKey, p.IsActive, p.CreatedAt);
            }
            return new PricingPlanSlotDto(s.Id, s.SlotNumber, planDto);
        }).ToList();
    }
}
