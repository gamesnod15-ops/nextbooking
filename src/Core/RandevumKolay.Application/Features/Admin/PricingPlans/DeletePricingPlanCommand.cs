using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

/// <summary>Deletes a pricing card. If it's currently shown in a display
/// slot, that slot is cleared rather than left dangling.</summary>
public record DeletePricingPlanCommand(Guid Id) : IRequest;

public sealed class DeletePricingPlanCommandHandler : IRequestHandler<DeletePricingPlanCommand>
{
    private readonly IApplicationDbContext _context;

    public DeletePricingPlanCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeletePricingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _context.PricingPlans.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Paket bulunamadı.");

        var slots = await _context.PricingPlanSlots
            .Where(s => s.PricingPlanId == request.Id)
            .ToListAsync(cancellationToken);
        foreach (var slot in slots)
            slot.Assign(null);

        _context.PricingPlans.Remove(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class DeletePricingPlanCommandValidator : AbstractValidator<DeletePricingPlanCommand>
{
    public DeletePricingPlanCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}
