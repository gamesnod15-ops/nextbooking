using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Deposits.Commands.ApplyDeposit;

public record ApplyDepositCommand(Guid Id) : IRequest;

public sealed class ApplyDepositCommandHandler
    : IRequestHandler<ApplyDepositCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ApplyDepositCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ApplyDepositCommand request, CancellationToken cancellationToken)
    {
        var deposit = await _context.Deposits
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Deposit not found.");

        if (deposit.TenantId != _tenantService.TenantId)
            throw new Common.Exceptions.ForbiddenAccessException();

        deposit.MarkAsApplied();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
