using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.PricingPlans;

public record CreatePricingPlanCommand(
    string Name,
    string BadgeLabel,
    string Description,
    decimal? Price,
    bool IsCustomPricing,
    string ButtonText,
    List<string> Features,
    bool IsHighlighted,
    string? HighlightLabel,
    string? PlanKey) : IRequest<Guid>;

public sealed class CreatePricingPlanCommandHandler : IRequestHandler<CreatePricingPlanCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreatePricingPlanCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(CreatePricingPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = PricingPlan.Create(
            request.Name, request.BadgeLabel, request.Description, request.Price, request.IsCustomPricing,
            request.ButtonText, request.Features, request.IsHighlighted, request.HighlightLabel, request.PlanKey);

        _context.PricingPlans.Add(plan);
        await _context.SaveChangesAsync(cancellationToken);

        return plan.Id;
    }
}

public class CreatePricingPlanCommandValidator : AbstractValidator<CreatePricingPlanCommand>
{
    public CreatePricingPlanCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BadgeLabel).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ButtonText).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Price).GreaterThan(0).When(x => !x.IsCustomPricing);
        RuleFor(x => x.HighlightLabel).MaximumLength(50);
        RuleFor(x => x.PlanKey).MaximumLength(50);
    }
}
