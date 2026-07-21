using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Support.Commands.SubmitSupportRequest;

public record SubmitSupportRequestCommand(string Subject, string Message) : IRequest;

public sealed class SubmitSupportRequestCommandHandler : IRequestHandler<SubmitSupportRequestCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupportSettingsProvider _supportSettings;
    private readonly IEmailService _emailService;

    public SubmitSupportRequestCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ISupportSettingsProvider supportSettings,
        IEmailService emailService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _supportSettings = supportSettings;
        _emailService = emailService;
    }

    public async Task Handle(SubmitSupportRequestCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                    <h2 style="margin-top:0;color:#111827;">Yeni Destek Talebi</h2>
                    <p style="color:#6b7280;line-height:1.6;">
                        <strong>Gönderen:</strong> {user.FirstName} {user.LastName} ({user.Email})<br>
                        <strong>Konu:</strong> {request.Subject}
                    </p>
                    <p style="color:#374151;line-height:1.6;white-space:pre-wrap;">{request.Message}</p>
                </div>
            </body>
            </html>
            """;

        await _emailService.SendAsync(new EmailMessage(
            _supportSettings.Email,
            $"BookingAi Destek Talebi — {request.Subject}",
            htmlBody,
            ReplyTo: user.Email), cancellationToken);
    }
}
