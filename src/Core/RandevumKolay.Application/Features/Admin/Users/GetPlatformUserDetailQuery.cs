using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Users;

public record GetPlatformUserDetailQuery(Guid UserId) : IRequest<PlatformUserDetailDto>;

public record PlatformUserDetailDto(
    Guid Id,
    string Email,
    string FullName,
    string FirstName,
    string LastName,
    string? Phone,
    string? JobTitle,
    string? AvatarUrl,
    string Role,
    Guid? TenantId,
    string? TenantName,
    string? TenantPlan,
    bool IsActive,
    bool EmailVerified,
    bool PhoneVerified,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt);

public sealed class GetPlatformUserDetailQueryHandler : IRequestHandler<GetPlatformUserDetailQuery, PlatformUserDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformUserDetailQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PlatformUserDetailDto> Handle(GetPlatformUserDetailQuery request, CancellationToken cancellationToken)
    {
        var result =
            await (from u in _context.Users.AsNoTracking()
                   join t in _context.Tenants.AsNoTracking() on u.TenantId equals t.Id into tenants
                   from t in tenants.DefaultIfEmpty()
                   where u.Id == request.UserId
                   select new PlatformUserDetailDto(
                       u.Id,
                       u.Email,
                       u.FullName,
                       u.FirstName,
                       u.LastName,
                       u.Phone,
                       u.JobTitle,
                       u.AvatarUrl,
                       u.Role,
                       u.TenantId,
                       t != null ? t.Name : null,
                       t != null ? t.Plan : null,
                       u.IsActive,
                       u.EmailVerified,
                       u.PhoneVerified,
                       u.LastLoginAt,
                       u.CreatedAt))
                  .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        return result;
    }
}
