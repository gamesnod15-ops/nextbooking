using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Deposits.Commands.CancelDeposit;

public record CancelDepositCommand(Guid Id) : IRequest;

public sealed class CancelDepositCommandHandler
    : IRequestHandler<CancelDepositCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CancelDepositCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(CancelDepositCommand request, CancellationToken cancellationToken)
    {
        var deposit = await _context.Deposits
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Deposit not found.");

        if (deposit.TenantId != _tenantService.TenantId)
            throw new Common.Exceptions.ForbiddenAccessException();

        deposit.Cancel();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
