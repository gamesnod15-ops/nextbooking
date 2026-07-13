using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.PaymentCards.Queries.GetPaymentCards;

public record GetPaymentCardsQuery : IRequest<List<PaymentCardDto>>;

public record PaymentCardDto(
    Guid Id,
    string Brand,
    string LastFour,
    string Expiry,
    string CardHolder,
    bool Default);

public sealed class GetPaymentCardsQueryHandler : IRequestHandler<GetPaymentCardsQuery, List<PaymentCardDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetPaymentCardsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<PaymentCardDto>> Handle(GetPaymentCardsQuery request, CancellationToken cancellationToken)
    {
        return await _context.PaymentCards
            .AsNoTracking()
            .Where(c => c.TenantId == _tenantService.TenantId)
            .OrderByDescending(c => c.IsDefault)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new PaymentCardDto(
                c.Id,
                c.Brand,
                c.LastFourDigits,
                c.ExpiryMonth + "/" + c.ExpiryYear.Substring(c.ExpiryYear.Length - 2, 2),
                c.CardHolderName,
                c.IsDefault))
            .ToListAsync(cancellationToken);
    }
}
