using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Users.Commands.DeactivateAccount;

public sealed record DeactivateAccountCommand(string Password) : IRequest;

public sealed class DeactivateAccountCommandHandler : IRequestHandler<DeactivateAccountCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public DeactivateAccountCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task Handle(DeactivateAccountCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Şifre hatalı.");

        var userEmail = user.Email;

        user.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                    <h2 style="margin-top:0;color:#111827;">Hesabiniz Pasiflestirildi</h2>
                    <p style="color:#6b7280;line-height:1.6;">
                        Merhaba <strong>{user.FirstName}</strong>,<br>
                        RandevumKolay hesabiniz basariyla pasiflestirilmistir. Tekrar giris yaparak hesabinizi yeniden aktif edebilirsiniz.
                    </p>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                        Tekrar aramiza bekleriz.
                    </p>
                </div>
            </body>
            </html>
            """;

        await _emailService.SendAsync(new EmailMessage(
            userEmail,
            "RandevumKolay — Hesabiniz Pasiflestirildi",
            htmlBody), cancellationToken);
    }
}
