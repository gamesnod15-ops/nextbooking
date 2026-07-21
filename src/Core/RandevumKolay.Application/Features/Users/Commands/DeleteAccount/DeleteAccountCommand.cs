using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Users.Commands.DeleteAccount;

public record DeleteAccountCommand(string Password) : IRequest;

public sealed class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public DeleteAccountCommandHandler(
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

    public async Task Handle(DeleteAccountCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Şifre hatalı.");

        var userEmail = user.Email;

        // Hard-delete all user/tenant related data using ExecuteDelete
        // (bypasses SoftDeleteInterceptor by generating raw SQL)
        var tenantId = user.TenantId;

        if (tenantId.HasValue)
        {
            // Collect IDs for cross-entity FK lookups
            var businessIds = await _context.Businesses
                .Where(b => b.TenantId == tenantId.Value)
                .Select(b => b.Id)
                .ToListAsync(cancellationToken);

            var employeeIds = await _context.Employees
                .Where(e => e.TenantId == tenantId.Value)
                .Select(e => e.Id)
                .ToListAsync(cancellationToken);

            // Leaf entities (no entity-level FK dependencies within tenant)
            await _context.FormSubmissions.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.CustomForms.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Surveys.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.WaitingListEntries.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.QueueItems.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.ProductPurchases.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.PaymentCards.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Advertisements.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Branches.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.DebtRecords.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.EmployeeCommissions.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.GiftCoupons.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Coupons.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Campaigns.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // EmployeeService (FK on Employee & Service)
            if (employeeIds.Count != 0)
                await _context.EmployeeServices
                    .Where(x => employeeIds.Contains(x.EmployeeId))
                    .ExecuteDeleteAsync(cancellationToken);

            // Appointments depend on Service, Employee, Customer (Restrict)
            await _context.Appointments.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Schedule depends on Employee, Payment depends on Appointment
            await _context.Payments.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.ScheduleExceptions.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Schedules.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Reviews (FK on Business → no TenantId, match via businessIds)
            if (businessIds.Count != 0)
                await _context.Reviews.Where(x => businessIds.Contains(x.BusinessId)).ExecuteDeleteAsync(cancellationToken);

            // Receivables → Installments
            await _context.Installments.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Receivables.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Package / Product
            await _context.Packages.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Products.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Employee / Service / Customer (depend on Business)
            await _context.Employees.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Services.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
            await _context.Customers.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Businesses (Restrict → must delete before Tenant)
            await _context.Businesses.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Audit log
            await _context.AuditLogs.Where(x => x.TenantId == tenantId.Value).ExecuteDeleteAsync(cancellationToken);

            // Delete the Tenant itself (BaseEntity — not soft-deletable)
            await _context.Tenants.Where(x => x.Id == tenantId.Value).ExecuteDeleteAsync(cancellationToken);
        }

        // Delete user-level data
        await _context.UserAuthProviders.Where(x => x.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        await _context.RefreshTokens.Where(rt => rt.UserId == userId).ExecuteDeleteAsync(cancellationToken);

        // Hard-delete the user (bypasses SoftDeleteInterceptor)
        await _context.Users.Where(u => u.Id == userId).ExecuteDeleteAsync(cancellationToken);

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                    <h2 style="margin-top:0;color:#111827;">Hesabiniz Kapatildi</h2>
                    <p style="color:#6b7280;line-height:1.6;">
                        Merhaba <strong>{user.FirstName}</strong>,<br>
                        BookingAi hesabiniz basariyla kapatilmistir. Tum verileriniz sistemden kaldirilmistir.
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
            "BookingAi — Hesabiniz Kapatildi",
            htmlBody), cancellationToken);
    }
}
