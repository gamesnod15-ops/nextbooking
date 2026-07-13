using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;

namespace RandevumKolay.Application.Features.Customers.Queries.GetCustomers;

public record GetCustomersQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    bool? IsBlocked = null) : IRequest<PaginatedList<CustomerDto>>;

public record CustomerDto(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    string? Notes,
    string? AvatarUrl,
    DateOnly? BirthDate,
    string? Gender,
    List<string> Tags,
    bool IsBlocked,
    DateTimeOffset? LastVisitAt,
    int TotalVisits,
    decimal TotalSpent,
    DateTimeOffset CreatedAt);

public sealed class GetCustomersQueryHandler : IRequestHandler<GetCustomersQuery, PaginatedList<CustomerDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetCustomersQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<CustomerDto>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Customers
            .AsNoTracking()
            .Where(c => c.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.Phone.Contains(term) ||
                (c.Email != null && c.Email.ToLower().Contains(term)));
        }

        if (request.IsBlocked.HasValue)
            query = query.Where(c => c.IsBlocked == request.IsBlocked.Value);

        var projected = query
            .OrderByDescending(c => c.LastVisitAt)
            .ThenBy(c => c.Name)
            .Select(c => new CustomerDto(
                c.Id,
                c.Name,
                c.Phone,
                c.Email,
                c.Notes,
                c.AvatarUrl,
                c.BirthDate,
                c.Gender,
                c.Tags,
                c.IsBlocked,
                c.LastVisitAt,
                c.TotalVisits,
                c.TotalSpent,
                c.CreatedAt));

        return await PaginatedList<CustomerDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
