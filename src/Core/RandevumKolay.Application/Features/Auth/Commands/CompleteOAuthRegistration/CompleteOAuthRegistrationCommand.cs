using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using DomainRefreshToken = RandevumKolay.Domain.Entities.RefreshToken;

namespace RandevumKolay.Application.Features.Auth.Commands.CompleteOAuthRegistration;

public record CompleteOAuthRegistrationCommand(
    string Provider,
    string ProviderUserId,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    string Username,
    string? BusinessName,
    string? Country,
    string? City,
    string? Purpose,
    bool AgreedToTerms,
    string? AvatarUrl,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<CompleteOAuthRegistrationResult>;

public record CompleteOAuthRegistrationResult(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string Role,
    string FullName,
    Guid? TenantId);

public sealed class CompleteOAuthRegistrationCommandHandler
    : IRequestHandler<CompleteOAuthRegistrationCommand, CompleteOAuthRegistrationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtService;

    public CompleteOAuthRegistrationCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<CompleteOAuthRegistrationResult> Handle(
        CompleteOAuthRegistrationCommand request,
        CancellationToken cancellationToken)
    {
        if (!request.AgreedToTerms)
            throw new Common.Exceptions.ValidationException("Kullanım şartlarını kabul etmelisiniz.");

        var existingUser = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant() && !u.IsDeleted, cancellationToken);

        User user;
        Guid? tenantId = null;

        if (existingUser is not null)
        {
            user = existingUser;
            if (!user.IsActive)
                user.Activate();
            user.RecordLogin();
        }
        else
        {
            user = User.Create(
                request.Email,
                string.Empty,
                request.FirstName,
                request.LastName,
                "user",
                null);

            user.SetAvatar(request.AvatarUrl);
            user.VerifyEmail();
            user.RecordLogin();
            _context.Users.Add(user);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var existingProvider = await _context.UserAuthProviders
            .FirstOrDefaultAsync(p =>
                p.Provider == request.Provider &&
                p.ProviderUserId == request.ProviderUserId,
                cancellationToken);

        if (existingProvider is null)
        {
            var authProvider = UserAuthProvider.Create(
                user.Id,
                request.Provider,
                request.ProviderUserId,
                request.Email,
                $"{request.FirstName} {request.LastName}",
                request.AvatarUrl);

            _context.UserAuthProviders.Add(authProvider);
        }

        var claims = new TokenClaims(user.Id, user.Email, user.Role, user.TenantId, user.Permissions);
        var accessToken = _jwtService.GenerateAccessToken(claims);

        var rawRefreshToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
        var tokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(rawRefreshToken)));

        var refreshToken = DomainRefreshToken.Create(user.Id, tokenHash, 7, request.DeviceInfo, request.IpAddress);
        _context.RefreshTokens.Add(refreshToken);

        await _context.SaveChangesAsync(cancellationToken);

        return new CompleteOAuthRegistrationResult(
            accessToken, rawRefreshToken, user.Id, user.Role,
            user.FullName, user.TenantId);
    }
}
