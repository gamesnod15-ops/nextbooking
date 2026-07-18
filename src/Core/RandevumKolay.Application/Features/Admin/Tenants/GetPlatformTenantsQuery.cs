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
        // Kept deliberately simple (no multi-way lateral joins) — Npgsql struggled to
        // translate a single query combining two "first matching row" left joins plus
        // scalar count subqueries. Page the tenants first, then batch-load the related
        // business/owner/counts for just that page in-memory.
        var tenantQuery = _context.Tenants.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            tenantQuery = tenantQuery.Where(t =>
                t.Name.ToLower().Contains(term) ||
                t.Subdomain.ToLower().Contains(term) ||
                _context.Businesses.Any(b => b.TenantId == t.Id && b.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.Plan))
            tenantQuery = tenantQuery.Where(t => t.Plan == request.Plan);

        if (request.IsActive.HasValue)
            tenantQuery = tenantQuery.Where(t => t.IsActive == request.IsActive.Value);

        tenantQuery = tenantQuery.OrderByDescending(t => t.CreatedAt);

        var page = await PaginatedList<RandevumKolay.Domain.Entities.Tenant>.CreateAsync(
            tenantQuery, request.PageNumber, request.PageSize, cancellationToken);

        var tenantIds = page.Items.Select(t => t.Id).ToList();

        var businesses = await _context.Businesses.AsNoTracking()
            .Where(b => tenantIds.Contains(b.TenantId))
            .OrderBy(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
        var businessByTenant = businesses.GroupBy(b => b.TenantId).ToDictionary(g => g.Key, g => g.First());

        var owners = await _context.Users.AsNoTracking()
            .Where(u => u.Role == "tenant_admin" && u.TenantId != null && tenantIds.Contains(u.TenantId!.Value))
            .OrderBy(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
        var ownerByTenant = owners.GroupBy(u => u.TenantId!.Value).ToDictionary(g => g.Key, g => g.First());

        var employeeCounts = await _context.Employees.AsNoTracking()
            .Where(e => tenantIds.Contains(e.TenantId))
            .GroupBy(e => e.TenantId)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, cancellationToken);

        var customerCounts = await _context.Customers.AsNoTracking()
            .Where(c => tenantIds.Contains(c.TenantId))
            .GroupBy(c => c.TenantId)
            .Select(g => new { TenantId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TenantId, x => x.Count, cancellationToken);

        var items = page.Items.Select(t =>
        {
            businessByTenant.TryGetValue(t.Id, out var b);
            ownerByTenant.TryGetValue(t.Id, out var owner);
            employeeCounts.TryGetValue(t.Id, out var employeeCount);
            customerCounts.TryGetValue(t.Id, out var customerCount);

            return new PlatformTenantDto(
                t.Id,
                t.Name,
                t.Subdomain,
                t.Plan,
                t.IsActive,
                t.TrialEndsAt,
                t.SubscriptionEndsAt,
                t.CreatedAt,
                b?.Id,
                b?.Name,
                b?.Category,
                b?.City,
                b?.Phone,
                b?.LogoUrl,
                owner?.Email,
                owner?.FullName,
                employeeCount,
                customerCount);
        }).ToList();

        return new PaginatedList<PlatformTenantDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
