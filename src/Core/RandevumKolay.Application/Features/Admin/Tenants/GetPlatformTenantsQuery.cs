using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Admin.Tenants;

/// <summary>Every registered business across the platform, for the manager
/// panel's business directory.</summary>
public record GetPlatformTenantsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    string? Plan = null,
    bool? IsActive = null) : IRequest<PaginatedList<PlatformTenantDto>>;

public record PlatformTenantDto(
    Guid TenantId,
    string TenantName,
    string Subdomain,
    string Plan,
    bool IsActive,
    DateTimeOffset? TrialEndsAt,
    DateTimeOffset? SubscriptionEndsAt,
    DateTimeOffset CreatedAt,
    Guid? BusinessId,
    string? BusinessName,
    BusinessCategory? Category,
    string? City,
    string? Phone,
    string? LogoUrl,
    string? OwnerEmail,
    string? OwnerFullName,
    int EmployeeCount,
    int CustomerCount);

public sealed class GetPlatformTenantsQueryHandler : IRequestHandler<GetPlatformTenantsQuery, PaginatedList<PlatformTenantDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformTenantsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformTenantDto>> Handle(GetPlatformTenantsQuery request, CancellationToken cancellationToken)
    {
        var query =
            from t in _context.Tenants.AsNoTracking()
            join b in _context.Businesses.AsNoTracking() on t.Id equals b.TenantId into businesses
            from b in businesses.OrderBy(x => x.CreatedAt).Take(1).DefaultIfEmpty()
            select new { t, b };

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x =>
                x.t.Name.ToLower().Contains(term) ||
                x.t.Subdomain.ToLower().Contains(term) ||
                (x.b != null && x.b.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.Plan))
            query = query.Where(x => x.t.Plan == request.Plan);

        if (request.IsActive.HasValue)
            query = query.Where(x => x.t.IsActive == request.IsActive.Value);

        var projected =
            from x in query
            join owner in _context.Users.AsNoTracking().Where(u => u.Role == "tenant_admin")
                on x.t.Id equals owner.TenantId into owners
            from owner in owners.OrderBy(o => o.CreatedAt).Take(1).DefaultIfEmpty()
            orderby x.t.CreatedAt descending
            select new PlatformTenantDto(
                x.t.Id,
                x.t.Name,
                x.t.Subdomain,
                x.t.Plan,
                x.t.IsActive,
                x.t.TrialEndsAt,
                x.t.SubscriptionEndsAt,
                x.t.CreatedAt,
                x.b != null ? x.b.Id : (Guid?)null,
                x.b != null ? x.b.Name : null,
                x.b != null ? x.b.Category : (BusinessCategory?)null,
                x.b != null ? x.b.City : null,
                x.b != null ? x.b.Phone : null,
                x.b != null ? x.b.LogoUrl : null,
                owner != null ? owner.Email : null,
                owner != null ? owner.FullName : null,
                _context.Employees.Count(e => e.TenantId == x.t.Id),
                _context.Customers.Count(c => c.TenantId == x.t.Id));

        return await PaginatedList<PlatformTenantDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
