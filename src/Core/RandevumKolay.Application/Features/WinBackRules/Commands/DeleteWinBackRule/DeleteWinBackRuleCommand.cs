using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WinBackRules.Commands.DeleteWinBackRule;

public record DeleteWinBackRuleCommand(Guid Id) : IRequest;

public sealed class DeleteWinBackRuleCommandHandler : IRequestHandler<DeleteWinBackRuleCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteWinBackRuleCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteWinBackRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _context.WinBackRules
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WinBackRule), request.Id);

        _context.WinBackRules.Remove(rule);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
