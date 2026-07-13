using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.GiftCoupons.Queries.GetGiftCoupons;

public record GetGiftCouponsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    GiftCouponStatus? Status = null,
    string? SearchTerm = null) : IRequest<PaginatedList<GiftCouponDto>>;

public record GiftCouponDto(
    Guid Id,
    string Code,
    decimal Amount,
    string RecipientName,
    string? RecipientEmail,
    string PurchasedBy,
    DateTimeOffset PurchaseDate,
    DateTimeOffset? ExpiryDate,
    decimal UsedAmount,
    GiftCouponStatus Status,
    string? Message,
    DateTimeOffset CreatedAt);

public sealed class GetGiftCouponsQueryHandler : IRequestHandler<GetGiftCouponsQuery, PaginatedList<GiftCouponDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetGiftCouponsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<GiftCouponDto>> Handle(GetGiftCouponsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.GiftCoupons
            .AsNoTracking()
            .Where(g => g.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(g => g.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(g =>
                g.Code.ToLower().Contains(term) ||
                g.RecipientName.ToLower().Contains(term) ||
                g.PurchasedBy.ToLower().Contains(term));
        }

        var projected = query
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new GiftCouponDto(
                g.Id, g.Code, g.Amount, g.RecipientName, g.RecipientEmail,
                g.PurchasedBy, g.PurchaseDate, g.ExpiryDate, g.UsedAmount,
                g.Status, g.Message, g.CreatedAt));

        return await PaginatedList<GiftCouponDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
