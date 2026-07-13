using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.PaymentCards.Commands.CreatePaymentCard;

public record CreatePaymentCardCommand(
    string CardHolder,
    string CardNumber,
    string Expiry,
    string Cvv,
    string Brand) : IRequest;

public sealed class CreatePaymentCardCommandHandler : IRequestHandler<CreatePaymentCardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreatePaymentCardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(CreatePaymentCardCommand request, CancellationToken cancellationToken)
    {
        var cleaned = request.CardNumber.Replace(" ", "");
        var lastFour = cleaned.Length >= 4 ? cleaned[^4..] : cleaned;

        var expiryParts = request.Expiry.Split('/');
        var expiryMonth = expiryParts.Length > 0 ? expiryParts[0] : "";
        var expiryYear = expiryParts.Length > 1 ? "20" + expiryParts[1] : "";

        // If this is the first card, make it default
        var existingCards = await _context.PaymentCards
            .Where(c => c.TenantId == _tenantService.TenantId)
            .CountAsync(cancellationToken);

        var card = PaymentCard.Create(
            _tenantService.TenantId,
            request.Brand,
            lastFour,
            expiryMonth,
            expiryYear,
            request.CardHolder,
            existingCards == 0);

        _context.PaymentCards.Add(card);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class CreatePaymentCardCommandValidator : AbstractValidator<CreatePaymentCardCommand>
{
    public CreatePaymentCardCommandValidator()
    {
        RuleFor(x => x.CardHolder).NotEmpty().WithName("Kart sahibi").MaximumLength(200);
        RuleFor(x => x.CardNumber).NotEmpty().WithName("Kart numarası");
        RuleFor(x => x.Expiry).NotEmpty().WithName("Son kullanma tarihi");
        RuleFor(x => x.Cvv).NotEmpty().WithName("CVV").Length(3, 4);
        RuleFor(x => x.Brand).NotEmpty().WithName("Kart markası").MaximumLength(50);
    }
}
