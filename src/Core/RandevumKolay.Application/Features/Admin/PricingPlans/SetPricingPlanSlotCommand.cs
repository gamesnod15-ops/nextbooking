using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

/// <summary>Assigns (or clears, when PricingPlanId is null) which pricing
/// card shows in a fixed display slot (1–4).</summary>
public record SetPricingPlanSlotCommand(int SlotNumber, Guid? PricingPlanId) : IRequest;

public sealed class SetPricingPlanSlotCommandHandler : IRequestHandler<SetPricingPlanSlotCommand>
{
    private readonly IApplicationDbContext _context;

    public SetPricingPlanSlotCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(SetPricingPlanSlotCommand request, CancellationToken cancellationToken)
    {
        var slot = await _context.PricingPlanSlots
            .FirstOrDefaultAsync(s => s.SlotNumber == request.SlotNumber, cancellationToken)
            ?? throw new KeyNotFoundException($"Slot {request.SlotNumber} bulunamadı.");

        if (request.PricingPlanId.HasValue)
        {
            var exists = await _context.PricingPlans.AnyAsync(p => p.Id == request.PricingPlanId.Value, cancellationToken);
            if (!exists) throw new KeyNotFoundException("Paket bulunamadı.");
        }

        slot.Assign(request.PricingPlanId);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class SetPricingPlanSlotCommandValidator : AbstractValidator<SetPricingPlanSlotCommand>
{
    public SetPricingPlanSlotCommandValidator()
    {
        RuleFor(x => x.SlotNumber).InclusiveBetween(1, 4);
    }
}
