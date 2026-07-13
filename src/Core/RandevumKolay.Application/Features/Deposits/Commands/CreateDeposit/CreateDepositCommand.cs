using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Deposits.Commands.CreateDeposit;

public record CreateDepositCommand(
    Guid AppointmentId,
    decimal Amount,
    string PaymentMethod = "CreditCard",
    string? Notes = null) : IRequest<Guid>;

public sealed class CreateDepositCommandHandler
    : IRequestHandler<CreateDepositCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateDepositCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateDepositCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("Appointment not found.");

        if (appointment.TenantId != _tenantService.TenantId)
            throw new Common.Exceptions.ForbiddenAccessException();

        var deposit = Deposit.Create(
            _tenantService.TenantId,
            request.AppointmentId,
            request.Amount,
            request.PaymentMethod,
            request.Notes,
            appointment.CustomerId);

        _context.Deposits.Add(deposit);
        await _context.SaveChangesAsync(cancellationToken);

        return deposit.Id;
    }
}
