using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.WinBackRules.Commands.CreateWinBackRule;

public record CreateWinBackRuleCommand(int DaysSinceLastVisit, string MessageTemplate) : IRequest<Guid>;

public sealed class CreateWinBackRuleCommandHandler : IRequestHandler<CreateWinBackRuleCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateWinBackRuleCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateWinBackRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = WinBackRule.Create(_tenantService.TenantId, request.DaysSinceLastVisit, request.MessageTemplate);
        _context.WinBackRules.Add(rule);
        await _context.SaveChangesAsync(cancellationToken);
        return rule.Id;
    }
}

public class CreateWinBackRuleCommandValidator : AbstractValidator<CreateWinBackRuleCommand>
{
    public CreateWinBackRuleCommandValidator()
    {
        RuleFor(x => x.DaysSinceLastVisit).GreaterThan(0);
        RuleFor(x => x.MessageTemplate).NotEmpty().MaximumLength(1000);
    }
}
