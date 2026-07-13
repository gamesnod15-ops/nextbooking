using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Users.Queries.GetUserDashboard;

public record GetUserDashboardQuery : IRequest<UserDashboardResult>;

public record UserDashboardResult(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    string Role,
    bool EmailVerified,
    bool PhoneVerified,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt,
    MembershipInfo? Membership,
    List<AuthProviderInfo> AuthProviders,
    List<ActiveSessionInfo> ActiveSessions);

public record MembershipInfo(
    string? Plan,
    string? BusinessName,
    Guid? TenantId,
    string? Subdomain,
    bool HasActiveSubscription);

public record AuthProviderInfo(
    string Provider,
    string? Email,
    string? FullName,
    string? AvatarUrl,
    DateTimeOffset ConnectedAt,
    DateTimeOffset? LastLoginAt);

public record ActiveSessionInfo(
    Guid SessionId,
    string? DeviceInfo,
    string? IpAddress,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ExpiresAt,
    bool IsCurrent);

public sealed class GetUserDashboardQueryHandler
    : IRequestHandler<GetUserDashboardQuery, UserDashboardResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetUserDashboardQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UserDashboardResult> Handle(
        GetUserDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new Common.Exceptions.NotFoundException("User not found.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("User not found.");

        var authProviders = await _context.UserAuthProviders
            .Where(p => p.UserId == userId)
            .Select(p => new AuthProviderInfo(
                p.Provider,
                p.Email,
                p.FullName,
                p.AvatarUrl,
                p.CreatedAt,
                p.LastLoginAt))
            .ToListAsync(cancellationToken);

        var activeSessions = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > DateTimeOffset.UtcNow)
            .Select(t => new ActiveSessionInfo(
                t.Id,
                t.DeviceInfo,
                t.IpAddress,
                t.CreatedAt,
                t.ExpiresAt,
                false))
            .ToListAsync(cancellationToken);

        MembershipInfo? membership = null;
        if (user.TenantId.HasValue)
        {
            var tenant = await _context.Tenants
                .Where(t => t.Id == user.TenantId.Value)
                .Select(t => new { t.Name, t.Subdomain, t.Plan })
                .FirstOrDefaultAsync(cancellationToken);

            if (tenant is not null)
            {
                membership = new MembershipInfo(
                    tenant.Plan,
                    tenant.Name,
                    user.TenantId,
                    tenant.Subdomain,
                    true);
            }
        }

        return new UserDashboardResult(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.FullName,
            user.Phone,
            user.AvatarUrl,
            user.Role,
            user.EmailVerified,
            user.PhoneVerified,
            user.LastLoginAt,
            user.CreatedAt,
            membership,
            authProviders,
            activeSessions);
    }
}
