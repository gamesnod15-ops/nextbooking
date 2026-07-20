using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WinBackRules.Commands.UpdateWinBackRule;

public record UpdateWinBackRuleCommand(
    Guid Id,
    int DaysSinceLastVisit,
    string MessageTemplate,
    bool IsActive) : IRequest;

public sealed class UpdateWinBackRuleCommandHandler : IRequestHandler<UpdateWinBackRuleCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateWinBackRuleCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateWinBackRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _context.WinBackRules
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WinBackRule), request.Id);

        rule.Update(request.DaysSinceLastVisit, request.MessageTemplate);
        if (request.IsActive) rule.Activate(); else rule.Deactivate();

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdateWinBackRuleCommandValidator : AbstractValidator<UpdateWinBackRuleCommand>
{
    public UpdateWinBackRuleCommandValidator()
    {
        RuleFor(x => x.DaysSinceLastVisit).GreaterThan(0);
        RuleFor(x => x.MessageTemplate).NotEmpty().MaximumLength(1000);
    }
}
