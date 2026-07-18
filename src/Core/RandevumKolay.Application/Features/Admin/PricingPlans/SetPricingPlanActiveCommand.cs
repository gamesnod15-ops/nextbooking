using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

public record SetPricingPlanActiveCommand(Guid Id, bool IsActive) : IRequest;

public sealed class SetPricingPlanActiveCommandHandler : IRequestHandler<SetPricingPlanActiveCommand>
{
    private readonly IApplicationDbContext _context;

    public SetPricingPlanActiveCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(SetPricingPlanActiveCommand request, CancellationToken cancellationToken)
    {
        var plan = await _context.PricingPlans.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Paket bulunamadı.");

        plan.SetActive(request.IsActive);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class SetPricingPlanActiveCommandValidator : AbstractValidator<SetPricingPlanActiveCommand>
{
    public SetPricingPlanActiveCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}
