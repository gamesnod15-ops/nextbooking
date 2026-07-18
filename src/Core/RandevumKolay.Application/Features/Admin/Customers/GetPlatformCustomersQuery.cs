using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Customers;

public enum PlatformCustomerSort { Recent, MostVisits, MostSpent, Name }

/// <summary>
/// Every business's end-customers (the appointment/booking client records they
/// manage themselves), across every tenant. These are not login accounts —
/// most are added by the business directly and never sign up as a User, which
/// is why the platform user directory (role=customer) is nearly always empty.
/// </summary>
public record GetPlatformCustomersQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? TenantId = null,
    bool? IsBlocked = null,
    int? MinTotalVisits = null,
    PlatformCustomerSort Sort = PlatformCustomerSort.Recent) : IRequest<PaginatedList<PlatformCustomerDto>>;

public record PlatformCustomerDto(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    bool IsBlocked,
    int TotalVisits,
    decimal TotalSpent,
    DateTimeOffset? LastVisitAt,
    DateTimeOffset CreatedAt,
    Guid TenantId,
    string? TenantName,
    string? BusinessName);

public sealed class GetPlatformCustomersQueryHandler : IRequestHandler<GetPlatformCustomersQuery, PaginatedList<PlatformCustomerDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformCustomersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformCustomerDto>> Handle(GetPlatformCustomersQuery request, CancellationToken cancellationToken)
    {
        var customerQuery = _context.Customers.AsNoTracking().AsQueryable();

        if (request.TenantId.HasValue)
            customerQuery = customerQuery.Where(c => c.TenantId == request.TenantId.Value);

        if (request.IsBlocked.HasValue)
            customerQuery = customerQuery.Where(c => c.IsBlocked == request.IsBlocked.Value);

        if (request.MinTotalVisits.HasValue)
            customerQuery = customerQuery.Where(c => c.TotalVisits >= request.MinTotalVisits.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            customerQuery = customerQuery.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.Phone.Contains(term) ||
                (c.Email != null && c.Email.ToLower().Contains(term)) ||
                _context.Tenants.Any(t => t.Id == c.TenantId && t.Name.ToLower().Contains(term)));
        }

        customerQuery = request.Sort switch
        {
            PlatformCustomerSort.MostVisits => customerQuery.OrderByDescending(c => c.TotalVisits),
            PlatformCustomerSort.MostSpent => customerQuery.OrderByDescending(c => c.TotalSpent),
            PlatformCustomerSort.Name => customerQuery.OrderBy(c => c.Name),
            _ => customerQuery.OrderByDescending(c => c.CreatedAt),
        };

        var page = await PaginatedList<Customer>.CreateAsync(customerQuery, request.PageNumber, request.PageSize, cancellationToken);

        var tenantIds = page.Items.Select(c => c.TenantId).Distinct().ToList();

        var tenants = await _context.Tenants.AsNoTracking()
            .Where(t => tenantIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);

        var businesses = await _context.Businesses.AsNoTracking()
            .Where(b => tenantIds.Contains(b.TenantId))
            .OrderBy(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
        var businessNameByTenant = businesses.GroupBy(b => b.TenantId).ToDictionary(g => g.Key, g => g.First().Name);

        var items = page.Items.Select(c => new PlatformCustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Email,
            c.IsBlocked,
            c.TotalVisits,
            c.TotalSpent,
            c.LastVisitAt,
            c.CreatedAt,
            c.TenantId,
            tenants.GetValueOrDefault(c.TenantId),
            businessNameByTenant.GetValueOrDefault(c.TenantId))).ToList();

        return new PaginatedList<PlatformCustomerDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
