using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Employees;

/// <summary>Every business's staff/personnel records, across every tenant.</summary>
public record GetPlatformEmployeesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? TenantId = null,
    bool? IsActive = null) : IRequest<PaginatedList<PlatformEmployeeDto>>;

public record PlatformEmployeeDto(
    Guid Id,
    string Name,
    string? Title,
    string? Phone,
    string? Email,
    bool IsActive,
    bool AcceptsOnlineBookings,
    DateTimeOffset CreatedAt,
    Guid TenantId,
    string? TenantName,
    string? BusinessName);

public sealed class GetPlatformEmployeesQueryHandler : IRequestHandler<GetPlatformEmployeesQuery, PaginatedList<PlatformEmployeeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformEmployeesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformEmployeeDto>> Handle(GetPlatformEmployeesQuery request, CancellationToken cancellationToken)
    {
        var employeeQuery = _context.Employees.AsNoTracking().AsQueryable();

        if (request.TenantId.HasValue)
            employeeQuery = employeeQuery.Where(e => e.TenantId == request.TenantId.Value);

        if (request.IsActive.HasValue)
            employeeQuery = employeeQuery.Where(e => e.IsActive == request.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            employeeQuery = employeeQuery.Where(e =>
                e.Name.ToLower().Contains(term) ||
                (e.Email != null && e.Email.ToLower().Contains(term)) ||
                (e.Phone != null && e.Phone.Contains(term)) ||
                _context.Tenants.Any(t => t.Id == e.TenantId && t.Name.ToLower().Contains(term)));
        }

        employeeQuery = employeeQuery.OrderByDescending(e => e.CreatedAt);

        var page = await PaginatedList<Employee>.CreateAsync(employeeQuery, request.PageNumber, request.PageSize, cancellationToken);

        var tenantIds = page.Items.Select(e => e.TenantId).Distinct().ToList();

        var tenants = await _context.Tenants.AsNoTracking()
            .Where(t => tenantIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);

        var businesses = await _context.Businesses.AsNoTracking()
            .Where(b => tenantIds.Contains(b.TenantId))
            .OrderBy(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
        var businessNameByTenant = businesses.GroupBy(b => b.TenantId).ToDictionary(g => g.Key, g => g.First().Name);

        var items = page.Items.Select(e => new PlatformEmployeeDto(
            e.Id,
            e.Name,
            e.Title,
            e.Phone,
            e.Email,
            e.IsActive,
            e.AcceptsOnlineBookings,
            e.CreatedAt,
            e.TenantId,
            tenants.GetValueOrDefault(e.TenantId),
            businessNameByTenant.GetValueOrDefault(e.TenantId))).ToList();

        return new PaginatedList<PlatformEmployeeDto>(items, page.TotalCount, page.PageNumber, page.PageSize);
    }
}
