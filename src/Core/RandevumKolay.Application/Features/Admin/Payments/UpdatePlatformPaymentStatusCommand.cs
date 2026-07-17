using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Payments;

public record UpdatePlatformPaymentStatusCommand(Guid PaymentId, PlatformPaymentStatus Status) : IRequest;

public sealed class UpdatePlatformPaymentStatusCommandHandler : IRequestHandler<UpdatePlatformPaymentStatusCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdatePlatformPaymentStatusCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdatePlatformPaymentStatusCommand request, CancellationToken cancellationToken)
    {
        var payment = await _context.PlatformPayments.FindAsync([request.PaymentId], cancellationToken)
            ?? throw new KeyNotFoundException("Ödeme kaydı bulunamadı.");

        payment.MarkStatus(request.Status);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdatePlatformPaymentStatusCommandValidator : AbstractValidator<UpdatePlatformPaymentStatusCommand>
{
    public UpdatePlatformPaymentStatusCommandValidator()
    {
        RuleFor(x => x.PaymentId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}
