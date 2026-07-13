using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Auth.Commands.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IEmailService emailService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted, cancellationToken);

        if (user is null || !user.IsActive)
            return;

        var token = _jwtTokenService.GeneratePasswordResetToken(user.Id, user.Email);
        var resetLink = $"https://randevumkolay.com/sifre-sifirla?token={token}";

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                    <h2 style="margin-top:0;color:#111827;">Sifre Sifirlama</h2>
                    <p style="color:#6b7280;line-height:1.6;">
                        Merhaba <strong>{user.FirstName}</strong>,<br>
                        RandevumKolay hesabiniz icin sifre sifirlama talebi alindi. Yeni sifre belirlemek icin asagidaki butona tiklayin.
                    </p>
                    <a href="{resetLink}" style="display:inline-block;padding:12px 24px;background:#111827;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">
                        Sifre Sifirla
                    </a>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                        Bu baglanti 1 saat boyunca gecerlidir. Eger bu talebi siz yapmadiysaniz bu e-postayi dikkate almayin.
                    </p>
                </div>
            </body>
            </html>
            """;

        await _emailService.SendAsync(new EmailMessage(
            request.Email,
            "RandevumKolay — Sifre Sifirlama",
            htmlBody), cancellationToken);
    }
}
