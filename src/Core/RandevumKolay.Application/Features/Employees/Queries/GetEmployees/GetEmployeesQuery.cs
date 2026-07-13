using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;

namespace RandevumKolay.Application.Features.Employees.Queries.GetEmployees;

public record GetEmployeesQuery(
    int PageNumber = 1,
    int PageSize = 50,
    string? SearchTerm = null,
    bool? IsActive = null) : IRequest<PaginatedList<EmployeeDto>>;

public record EmployeeDto(
    Guid Id,
    string Name,
    string? Title,
    string? Bio,
    string? Phone,
    string? Email,
    string? AvatarUrl,
    bool IsActive,
    bool AcceptsOnlineBookings,
    List<Guid> ServiceIds,
    DateTimeOffset CreatedAt);

public sealed class GetEmployeesQueryHandler : IRequestHandler<GetEmployeesQuery, PaginatedList<EmployeeDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetEmployeesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<EmployeeDto>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Employees
            .AsNoTracking()
            .Include(e => e.EmployeeServices)
            .Where(e => e.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(term) ||
                (e.Email != null && e.Email.ToLower().Contains(term)));
        }

        if (request.IsActive.HasValue)
            query = query.Where(e => e.IsActive == request.IsActive.Value);

        var projected = query
            .OrderBy(e => e.Name)
            .Select(e => new EmployeeDto(
                e.Id,
                e.Name,
                e.Title,
                e.Bio,
                e.Phone,
                e.Email,
                e.AvatarUrl,
                e.IsActive,
                e.AcceptsOnlineBookings,
                e.EmployeeServices.Select(es => es.ServiceId).ToList(),
                e.CreatedAt));

        return await PaginatedList<EmployeeDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
