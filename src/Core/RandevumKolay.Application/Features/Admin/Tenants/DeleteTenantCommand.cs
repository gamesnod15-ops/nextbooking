using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Tenants;

public record DeleteTenantCommand(Guid TenantId) : IRequest;

public sealed class DeleteTenantCommandHandler : IRequestHandler<DeleteTenantCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteTenantCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteTenantCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants.FindAsync([request.TenantId], cancellationToken)
            ?? throw new KeyNotFoundException("İşletme bulunamadı.");

        var tid = tenant.Id;
        var db = ((DbContext)_context).Database;

        string[] tenantIdTables =
        [
            "WinBackSendLogs", "WinBackRules", "WhatsAppMessages", "WhatsAppConversations",
            "WhatsAppBookingDrafts", "WhatsAppIntegrations", "Surveys", "FormSubmissions",
            "CustomForms", "NoShowPredictions", "LoyaltyRedemptions", "LoyaltyRewards",
            "LoyaltyMembers", "LoyaltyTiers", "AiUsageRecords", "QueueItems",
            "WaitingListEntries", "ProductPurchases", "PaymentCards",
            "Deposits", "DebtRecords", "Installments", "Receivables", "Products",
            "GiftCoupons", "Campaigns", "Coupons", "Packages", "EmployeeCommissions",
            "Advertisements", "Branches", "EmployeeServices", "Schedules",
            "ScheduleExceptions", "Services", "Payments", "AuditLogs",
            "PlatformPayments", "Feedbacks",
            "Appointments", "Employees", "Customers", "Users", "Businesses"
        ];

        foreach (var table in tenantIdTables)
        {
            var sql = $"DELETE FROM \"{table}\" WHERE \"TenantId\" = @p0";
            await db.ExecuteSqlRawAsync(sql, tid, cancellationToken);
        }

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"Reviews\" WHERE \"BusinessId\" IN (SELECT \"Id\" FROM \"Businesses\" WHERE \"TenantId\" = @p0)",
            tid, cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"RefreshTokens\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"TenantId\" = @p0)",
            tid, cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"UserAuthProviders\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"TenantId\" = @p0)",
            tid, cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"Tenants\" WHERE \"Id\" = @p0", tid, cancellationToken);
    }
}

public class DeleteTenantCommandValidator : AbstractValidator<DeleteTenantCommand>
{
    public DeleteTenantCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
