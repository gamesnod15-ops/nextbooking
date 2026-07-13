using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Tenants.Commands.RegisterTenant;

public record RegisterTenantCommand(
    string BusinessName,
    string Subdomain,
    string OwnerEmail,
    string OwnerPassword,
    string OwnerFirstName,
    string OwnerLastName,
    string OwnerPhone,
    BusinessCategory BusinessCategory,
    string Plan = "starter") : IRequest<RegisterTenantResult>;

public record RegisterTenantResult(Guid TenantId, Guid UserId, string Subdomain);

public sealed class RegisterTenantCommandHandler : IRequestHandler<RegisterTenantCommand, RegisterTenantResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailService _emailService;

    public RegisterTenantCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IEmailService emailService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _emailService = emailService;
    }

    public async Task<RegisterTenantResult> Handle(
        RegisterTenantCommand request, CancellationToken cancellationToken)
    {
        var subdomainTaken = await _context.Tenants
            .AnyAsync(t => t.Subdomain == request.Subdomain.ToLowerInvariant(), cancellationToken);

        if (subdomainTaken)
            throw new Common.Exceptions.ConflictException($"Subdomain '{request.Subdomain}' is already taken.");

        var emailTaken = await _context.Users
            .AnyAsync(u => u.Email == request.OwnerEmail.ToLowerInvariant(), cancellationToken);

        if (emailTaken)
            throw new Common.Exceptions.ConflictException("Email address is already registered.");

        var tenant = Tenant.Create(request.BusinessName, request.Subdomain, request.OwnerEmail, request.Plan);
        _context.Tenants.Add(tenant);

        var business = RandevumKolay.Domain.Entities.Business.Create(tenant.Id, request.BusinessName, request.BusinessCategory);
        _context.Businesses.Add(business);

        var passwordHash = _passwordHasher.Hash(request.OwnerPassword);
        var owner = User.Create(
            request.OwnerEmail,
            passwordHash,
            request.OwnerFirstName,
            request.OwnerLastName,
            "tenant_admin",
            tenant.Id);

        _context.Users.Add(owner);
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.GenerateEmailVerificationToken(owner.Id, owner.Email);
        var verifyLink = $"https://randevumkolay.com/hesap-dogrula?token={token}";

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                    <h2 style="margin-top:0;color:#111827;">Hesabınızı Doğrulayın</h2>
                    <p style="color:#6b7280;line-height:1.6;">
                        Merhaba <strong>{owner.FirstName}</strong>,<br>
                        RandevumKolay hesabınız başarıyla oluşturuldu. Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
                    </p>
                    <a href="{verifyLink}" style="display:inline-block;padding:12px 24px;background:#111827;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">
                        Hesabı Aktifleştir
                    </a>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                        Bu bağlantı 24 saat boyunca geçerlidir. Eğer hesap oluşturmadıysanız bu e-postayı dikkate almayın.
                    </p>
                </div>
            </body>
            </html>
            """;

        await _emailService.SendAsync(new EmailMessage(
            request.OwnerEmail,
            "RandevumKolay — Hesabınızı Doğrulayın",
            htmlBody), cancellationToken);

        return new RegisterTenantResult(tenant.Id, owner.Id, tenant.Subdomain);
    }
}
