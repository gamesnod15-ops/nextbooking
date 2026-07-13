using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using DomainRefreshToken = RandevumKolay.Domain.Entities.RefreshToken;

namespace RandevumKolay.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken, string? IpAddress = null) : IRequest<RefreshTokenResult>;

public record RefreshTokenResult(string AccessToken, string RefreshToken);

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtService;
    private readonly IEmailVerificationConfiguration _emailVerification;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtService,
        IEmailVerificationConfiguration emailVerification)
    {
        _context = context;
        _jwtService = jwtService;
        _emailVerification = emailVerification;
    }

    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(request.RefreshToken)));

        var existing = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (existing is null || !existing.IsActive)
            throw new ForbiddenAccessException("Invalid or expired refresh token.");

        var user = existing.User!;
        if (!user.IsActive)
            throw new ForbiddenAccessException("Hesap devre dışı bırakılmış.");

        if (_emailVerification.Required && !user.EmailVerified)
            throw new ForbiddenAccessException("Hesabınız henüz doğrulanmamış.");

        // Rotate: revoke old, create new
        existing.Revoke();

        var rawNew = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
        var newHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(rawNew)));

        var newToken = DomainRefreshToken.Create(user.Id, newHash, 7, existing.DeviceInfo, request.IpAddress);
        _context.RefreshTokens.Add(newToken);

        var claims = new TokenClaims(user.Id, user.Email, user.Role, user.TenantId, user.Permissions);
        var accessToken = _jwtService.GenerateAccessToken(claims);

        await _context.SaveChangesAsync(cancellationToken);

        return new RefreshTokenResult(accessToken, rawNew);
    }
}
