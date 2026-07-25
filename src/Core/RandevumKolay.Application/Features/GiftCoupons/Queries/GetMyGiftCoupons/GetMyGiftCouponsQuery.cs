using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.GiftCoupons.Queries.GetMyGiftCoupons;

/// <summary>
/// Gift coupons a guest customer has received, matched by the email they used
/// when booking — across every tenant, since a customer isn't tied to one
/// business.
/// </summary>
public record GetMyGiftCouponsQuery(string Email) : IRequest<List<MyGiftCouponDto>>;

public record MyGiftCouponDto(
    Guid Id,
    string Code,
    decimal Amount,
    decimal UsedAmount,
    string? BusinessName,
    DateTimeOffset PurchaseDate,
    DateTimeOffset? ExpiryDate,
    GiftCouponStatus Status,
    string? Message);

public sealed class GetMyGiftCouponsQueryHandler
    : IRequestHandler<GetMyGiftCouponsQuery, List<MyGiftCouponDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyGiftCouponsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<MyGiftCouponDto>> Handle(GetMyGiftCouponsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return [];

        var email = request.Email.Trim().ToLowerInvariant();

        var coupons = await _context.GiftCoupons
            .AsNoTracking()
            .Where(g => g.RecipientEmail != null && g.RecipientEmail.ToLower() == email)
            .OrderByDescending(g => g.PurchaseDate)
            .ToListAsync(cancellationToken);

        if (coupons.Count == 0)
            return [];

        var tenantIds = coupons.Select(c => c.TenantId).Distinct().ToList();
        var businessNames = await _context.Businesses
            .AsNoTracking()
            .Where(b => tenantIds.Contains(b.TenantId))
            .Select(b => new { b.TenantId, b.Name })
            .ToListAsync(cancellationToken);

        var nameByTenant = businessNames
            .GroupBy(b => b.TenantId)
            .ToDictionary(g => g.Key, g => g.First().Name);

        return coupons
            .Select(c => new MyGiftCouponDto(
                c.Id,
                c.Code,
                c.Amount,
                c.UsedAmount,
                nameByTenant.GetValueOrDefault(c.TenantId),
                c.PurchaseDate,
                c.ExpiryDate,
                c.Status,
                c.Message))
            .ToList();
    }
}
