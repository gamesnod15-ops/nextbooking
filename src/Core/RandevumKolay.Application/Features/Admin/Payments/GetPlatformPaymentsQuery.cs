using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Payments;

/// <summary>Platform revenue ledger — subscription, advertiser and sponsorship
/// payments, across every tenant.</summary>
public record GetPlatformPaymentsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    PlatformPaymentType? Type = null,
    PlatformPaymentStatus? Status = null,
    string? SearchTerm = null) : IRequest<PaginatedList<PlatformPaymentDto>>;

public record PlatformPaymentDto(
    Guid Id,
    PlatformPaymentType Type,
    Guid? TenantId,
    string? TenantName,
    string PayerName,
    string? Description,
    decimal Amount,
    string Currency,
    PlatformPaymentStatus Status,
    DateTimeOffset? PaidAt,
    DateTimeOffset CreatedAt,
    string? BillingAddress,
    string? BillingCity,
    string? BillingCountry,
    string? TaxNumber,
    string? TaxOffice);

public sealed class GetPlatformPaymentsQueryHandler : IRequestHandler<GetPlatformPaymentsQuery, PaginatedList<PlatformPaymentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformPaymentsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformPaymentDto>> Handle(GetPlatformPaymentsQuery request, CancellationToken cancellationToken)
    {
        var query =
            from p in _context.PlatformPayments.AsNoTracking()
            join t in _context.Tenants.AsNoTracking() on p.TenantId equals t.Id into tenants
            from t in tenants.DefaultIfEmpty()
            select new { p, t };

        if (request.Type.HasValue)
            query = query.Where(x => x.p.Type == request.Type.Value);

        if (request.Status.HasValue)
            query = query.Where(x => x.p.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x =>
                x.p.PayerName.ToLower().Contains(term) ||
                (x.t != null && x.t.Name.ToLower().Contains(term)));
        }

        var projected = query
            .OrderByDescending(x => x.p.CreatedAt)
            .Select(x => new PlatformPaymentDto(
                x.p.Id,
                x.p.Type,
                x.p.TenantId,
                x.t != null ? x.t.Name : null,
                x.p.PayerName,
                x.p.Description,
                x.p.Amount,
                x.p.Currency,
                x.p.Status,
                x.p.PaidAt,
                x.p.CreatedAt,
                x.p.BillingAddress,
                x.p.BillingCity,
                x.p.BillingCountry,
                x.p.TaxNumber,
                x.p.TaxOffice));

        return await PaginatedList<PlatformPaymentDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
