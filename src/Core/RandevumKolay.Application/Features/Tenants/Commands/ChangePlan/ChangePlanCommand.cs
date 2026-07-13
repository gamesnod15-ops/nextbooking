using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Tenants.Commands.ChangePlan;

public record ChangePlanCommand(string Plan, int Months = 1) : IRequest;

public sealed class ChangePlanCommandHandler : IRequestHandler<ChangePlanCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ChangePlanCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ChangePlanCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Tenant not found.");

        tenant.ExtendSubscription(DateTimeOffset.UtcNow.AddMonths(request.Months), request.Plan);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class ChangePlanCommandValidator : AbstractValidator<ChangePlanCommand>
{
    private static readonly int[] ValidMonths = [1, 6, 12, 24, 36];
    private static readonly string[] ValidPlans = ["starter", "business", "professional", "custom"];

    public ChangePlanCommandValidator()
    {
        RuleFor(x => x.Plan)
            .NotEmpty()
            .Must(p => ValidPlans.Contains(p))
            .WithMessage("Invalid plan. Must be one of: starter, business, professional, custom.");

        RuleFor(x => x.Months)
            .Must(m => ValidMonths.Contains(m))
            .WithMessage("Invalid months. Must be one of: 1, 6, 12, 24, 36.");
    }
}
