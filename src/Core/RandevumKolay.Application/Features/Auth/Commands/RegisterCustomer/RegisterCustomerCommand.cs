using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Auth.Commands.RegisterCustomer;

public record RegisterCustomerCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string Phone) : IRequest<RegisterCustomerResult>;

public record RegisterCustomerResult(Guid UserId, string FullName);

public sealed class RegisterCustomerCommandHandler
    : IRequestHandler<RegisterCustomerCommand, RegisterCustomerResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly ICacheService _cache;
    private readonly IEmailVerificationConfiguration _emailVerification;

    public RegisterCustomerCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IEmailService emailService,
        ISmsService smsService,
        ICacheService cache,
        IEmailVerificationConfiguration emailVerification)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
        _smsService = smsService;
        _cache = cache;
        _emailVerification = emailVerification;
    }

    public async Task<RegisterCustomerResult> Handle(
        RegisterCustomerCommand request, CancellationToken cancellationToken)
    {
        var emailTaken = await _context.Users
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (emailTaken)
            throw new Common.Exceptions.ConflictException("Bu e-posta adresi zaten kayıtlı.");

        var passwordHash = _passwordHasher.Hash(request.Password);

        var user = User.Create(
            request.Email,
            passwordHash,
            request.FirstName,
            request.LastName,
            "customer",
            null);

        user.UpdateProfile(request.FirstName, request.LastName, request.Phone, null);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        if (_emailVerification.Required)
        {
            var token = _jwtTokenService.GenerateEmailVerificationToken(user.Id, user.Email);
            var verifyLink = $"https://randevumkolay.com/hesap-dogrula?token={token}";

            var htmlBody = $"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                    <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                        <h2 style="margin-top:0;color:#111827;">Hesabınızı Doğrulayın</h2>
                        <p style="color:#6b7280;line-height:1.6;">
                            Merhaba <strong>{user.FirstName}</strong>,<br>
                            RandevumKolay hesabınız başarıyla oluşturuldu. Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
                        </p>
                        <a href="{verifyLink}" style="display:inline-block;padding:12px 24px;background:#111827;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">
                            Hesabı Aktifleştir
                        </a>
                        <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                            Bu bağlantı 24 saat boyunca geçerlidir.
                        </p>
                    </div>
                </body>
                </html>
                """;

            await _emailService.SendAsync(new EmailMessage(
                request.Email,
                "RandevumKolay — Hesabınızı Doğrulayın",
                htmlBody), cancellationToken);
        }
        else
        {
            user.VerifyEmail();
        }

        // Send phone OTP
        var otp = Random.Shared.Next(100000, 999999).ToString();
        await _cache.SetAsync($"phone_otp:{request.Phone}", otp, TimeSpan.FromMinutes(5), cancellationToken);
        await _smsService.SendOtpAsync(request.Phone, otp, cancellationToken);

        return new RegisterCustomerResult(user.Id, user.FullName);
    }
}
