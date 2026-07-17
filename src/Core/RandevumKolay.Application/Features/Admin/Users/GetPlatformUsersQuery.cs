using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;

namespace RandevumKolay.Application.Features.Admin.Users;

/// <summary>Platform-wide user directory for the manager panel — every account
/// across every tenant, not just the caller's own tenant.</summary>
public record GetPlatformUsersQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    string? Role = null,
    bool? IsActive = null) : IRequest<PaginatedList<PlatformUserDto>>;

public record PlatformUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    Guid? TenantId,
    string? TenantName,
    string? TenantPlan,
    bool IsActive,
    bool EmailVerified,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt);

public sealed class GetPlatformUsersQueryHandler : IRequestHandler<GetPlatformUsersQuery, PaginatedList<PlatformUserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformUsersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformUserDto>> Handle(GetPlatformUsersQuery request, CancellationToken cancellationToken)
    {
        var query =
            from u in _context.Users.AsNoTracking()
            join t in _context.Tenants.AsNoTracking() on u.TenantId equals t.Id into tenants
            from t in tenants.DefaultIfEmpty()
            select new { u, t };

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x =>
                x.u.Email.ToLower().Contains(term) ||
                x.u.FirstName.ToLower().Contains(term) ||
                x.u.LastName.ToLower().Contains(term) ||
                (x.u.Phone != null && x.u.Phone.Contains(term)) ||
                (x.t != null && x.t.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
            query = query.Where(x => x.u.Role == request.Role);

        if (request.IsActive.HasValue)
            query = query.Where(x => x.u.IsActive == request.IsActive.Value);

        var projected = query
            .OrderByDescending(x => x.u.CreatedAt)
            .Select(x => new PlatformUserDto(
                x.u.Id,
                x.u.Email,
                x.u.FullName,
                x.u.Phone,
                x.u.Role,
                x.u.TenantId,
                x.t != null ? x.t.Name : null,
                x.t != null ? x.t.Plan : null,
                x.u.IsActive,
                x.u.EmailVerified,
                x.u.LastLoginAt,
                x.u.CreatedAt));

        return await PaginatedList<PlatformUserDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
