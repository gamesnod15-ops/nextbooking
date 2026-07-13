using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Deposits.Commands.ForfeitDeposit;

public record ForfeitDepositCommand(Guid Id) : IRequest;

public sealed class ForfeitDepositCommandHandler
    : IRequestHandler<ForfeitDepositCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ForfeitDepositCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ForfeitDepositCommand request, CancellationToken cancellationToken)
    {
        var deposit = await _context.Deposits
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Deposit not found.");

        if (deposit.TenantId != _tenantService.TenantId)
            throw new Common.Exceptions.ForbiddenAccessException();

        deposit.MarkAsForfeited();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
