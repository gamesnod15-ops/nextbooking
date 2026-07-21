using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Payments.Commands.RecordPayment;

/// <summary>
/// Manually records a payment against an appointment (cash/card taken in person,
/// bank transfer, etc.) — there is no live payment-gateway integration yet, so this
/// is the only way a Payment row gets created outside of seed data.
/// </summary>
public record RecordPaymentCommand(Guid AppointmentId, decimal Amount, string Provider) : IRequest<Guid>;

public sealed class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public RecordPaymentCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId && a.TenantId == tenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Appointment), request.AppointmentId);

        var alreadyPaid = await _context.Payments
            .AnyAsync(p => p.AppointmentId == request.AppointmentId && p.Status == PaymentStatus.Completed, cancellationToken);
        if (alreadyPaid)
            throw new ConflictException("Bu randevu için zaten bir ödeme kaydedilmiş.");

        var payment = Payment.Create(tenantId, request.AppointmentId, request.Provider, request.Amount);
        payment.MarkAsCompleted(request.Provider);

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(cancellationToken);

        return payment.Id;
    }
}

public class RecordPaymentCommandValidator : AbstractValidator<RecordPaymentCommand>
{
    public RecordPaymentCommandValidator()
    {
        RuleFor(x => x.Provider).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}
