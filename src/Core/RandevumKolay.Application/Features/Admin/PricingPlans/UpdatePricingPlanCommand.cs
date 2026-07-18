using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

public record UpdatePricingPlanCommand(
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
    string? PlanKey) : IRequest;

public sealed class UpdatePricingPlanCommandHandler : IRequestHandler<UpdatePricingPlanCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdatePricingPlanCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdatePricingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _context.PricingPlans.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Paket bulunamadı.");

        plan.Update(
            request.Name, request.BadgeLabel, request.Description, request.Price, request.IsCustomPricing,
            request.ButtonText, request.Features, request.IsHighlighted, request.HighlightLabel, request.PlanKey);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdatePricingPlanCommandValidator : AbstractValidator<UpdatePricingPlanCommand>
{
    public UpdatePricingPlanCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BadgeLabel).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ButtonText).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Price).GreaterThan(0).When(x => !x.IsCustomPricing);
        RuleFor(x => x.HighlightLabel).MaximumLength(50);
        RuleFor(x => x.PlanKey).MaximumLength(50);
    }
}
