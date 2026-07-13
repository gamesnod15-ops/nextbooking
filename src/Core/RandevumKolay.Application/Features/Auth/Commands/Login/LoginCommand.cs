using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using DomainRefreshToken = RandevumKolay.Domain.Entities.RefreshToken;

namespace RandevumKolay.Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password,
    string? DeviceInfo = null,
    string? IpAddress = null) : IRequest<LoginResult>;

public record LoginResult(
    string AccessToken,
    string RefreshToken,
    string Role,
    Guid UserId,
    string FullName,
    Guid? TenantId,
    bool EmailVerified,
    bool PhoneVerified);

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailVerificationConfiguration _emailVerification;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtService,
        IPasswordHasher passwordHasher,
        IEmailVerificationConfiguration emailVerification)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _emailVerification = emailVerification;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant()
                                   && u.IsActive
                                   && !u.IsDeleted, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("E-posta veya şifre hatalı.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new Common.Exceptions.NotFoundException("E-posta veya şifre hatalı.");

        if (_emailVerification.Required && !user.EmailVerified)
            throw new Common.Exceptions.ForbiddenAccessException("Hesabınız henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.");

        user.RecordLogin();

        var claims = new TokenClaims(
            user.Id, user.Email, user.Role, user.TenantId, user.Permissions);

        var accessToken = _jwtService.GenerateAccessToken(claims);

        // Generate refresh token
        var rawRefreshToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
        var tokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(rawRefreshToken)));

        var refreshToken = DomainRefreshToken.Create(
            user.Id, tokenHash, 7, request.DeviceInfo, request.IpAddress);

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new LoginResult(accessToken, rawRefreshToken, user.Role, user.Id, user.FullName, user.TenantId, user.EmailVerified, user.PhoneVerified);
    }
}
