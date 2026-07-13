using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using DomainRefreshToken = RandevumKolay.Domain.Entities.RefreshToken;

namespace RandevumKolay.Application.Features.Auth.Commands.OAuthLogin;

public record OAuthLoginCommand(
    string Provider,
    string Token,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<OAuthLoginResult>;

public record OAuthLoginResult(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string Role,
    string FullName,
    string Email,
    string? AvatarUrl,
    Guid? TenantId,
    bool IsNewUser,
    OAuthUserInfo? ProviderInfo);

public sealed class OAuthLoginCommandHandler : IRequestHandler<OAuthLoginCommand, OAuthLoginResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtService;
    private readonly IOAuthService _oauthService;

    public OAuthLoginCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtService,
        IOAuthService oauthService)
    {
        _context = context;
        _jwtService = jwtService;
        _oauthService = oauthService;
    }

    public async Task<OAuthLoginResult> Handle(OAuthLoginCommand request, CancellationToken cancellationToken)
    {
        var providerInfo = await _oauthService.VerifyTokenAsync(request.Provider, request.Token);

        var existingProvider = await _context.UserAuthProviders
            .FirstOrDefaultAsync(p =>
                p.Provider == providerInfo.Provider &&
                p.ProviderUserId == providerInfo.ProviderUserId,
                cancellationToken);

        if (existingProvider is not null)
        {
            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .FirstAsync(u => u.Id == existingProvider.UserId && u.IsActive && !u.IsDeleted, cancellationToken);

            existingProvider.RecordLogin();
            user.RecordLogin();

            var claims = new TokenClaims(user.Id, user.Email, user.Role, user.TenantId, user.Permissions);
            var accessToken = _jwtService.GenerateAccessToken(claims);
            var rawRefreshToken = GenerateRefreshToken();
            var refreshToken = CreateRefreshTokenEntity(user.Id, rawRefreshToken, request.DeviceInfo, request.IpAddress);

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new OAuthLoginResult(
                accessToken, rawRefreshToken, user.Id, user.Role,
                user.FullName, user.Email, user.AvatarUrl,
                user.TenantId, false, null);
        }

        var existingUser = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == providerInfo.Email.ToLowerInvariant() && !u.IsDeleted, cancellationToken);

        if (existingUser is not null && existingUser.IsActive)
        {
            var authProvider = UserAuthProvider.Create(
                existingUser.Id, providerInfo.Provider, providerInfo.ProviderUserId,
                providerInfo.Email, providerInfo.FullName, providerInfo.AvatarUrl);

            existingUser.SetAvatar(providerInfo.AvatarUrl);
            existingUser.RecordLogin();

            _context.UserAuthProviders.Add(authProvider);

            var claims = new TokenClaims(existingUser.Id, existingUser.Email, existingUser.Role, existingUser.TenantId, existingUser.Permissions);
            var accessToken = _jwtService.GenerateAccessToken(claims);
            var rawRefreshToken = GenerateRefreshToken();
            var refreshToken = CreateRefreshTokenEntity(existingUser.Id, rawRefreshToken, request.DeviceInfo, request.IpAddress);

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new OAuthLoginResult(
                accessToken, rawRefreshToken, existingUser.Id, existingUser.Role,
                existingUser.FullName, existingUser.Email, existingUser.AvatarUrl,
                existingUser.TenantId, false, null);
        }

        return new OAuthLoginResult(
            string.Empty, string.Empty, Guid.Empty, string.Empty,
            providerInfo.FullName, providerInfo.Email, providerInfo.AvatarUrl,
            null, true, providerInfo);
    }

    private static string GenerateRefreshToken()
        => Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));

    private static DomainRefreshToken CreateRefreshTokenEntity(Guid userId, string rawToken, string? deviceInfo, string? ipAddress)
    {
        var tokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(rawToken)));

        return DomainRefreshToken.Create(userId, tokenHash, 7, deviceInfo, ipAddress);
    }
}
