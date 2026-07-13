using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.PaymentCards.Commands.UpdatePaymentCard;

public record UpdatePaymentCardCommand(
    Guid Id,
    string CardHolder,
    string Expiry) : IRequest;

public sealed class UpdatePaymentCardCommandHandler : IRequestHandler<UpdatePaymentCardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdatePaymentCardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdatePaymentCardCommand request, CancellationToken cancellationToken)
    {
        var card = await _context.PaymentCards
            .Where(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Payment card not found.");

        var expiryParts = request.Expiry.Split('/');
        var expiryMonth = expiryParts.Length > 0 ? expiryParts[0] : "";
        var expiryYear = expiryParts.Length > 1 ? "20" + expiryParts[1] : "";

        card.Update(request.CardHolder, expiryMonth, expiryYear);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdatePaymentCardCommandValidator : AbstractValidator<UpdatePaymentCardCommand>
{
    public UpdatePaymentCardCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.CardHolder).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Expiry).NotEmpty();
    }
}
