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

        var tenantId = tenant.Id;
        var db = ((DbContext)_context).Database;

        var userIds = await _context.Users
            .Where(u => u.TenantId == tenantId)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        if (userIds.Count > 0)
        {
            await db.ExecuteSqlRawAsync(
                "DELETE FROM \"RefreshTokens\" WHERE \"UserId\" = ANY(@p0)", userIds, cancellationToken);
            await db.ExecuteSqlRawAsync(
                "DELETE FROM \"UserAuthProviders\" WHERE \"UserId\" = ANY(@p0)", userIds, cancellationToken);
        }

        var businessIds = await _context.Businesses
            .Where(b => b.TenantId == tenantId)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        if (businessIds.Count > 0)
        {
            await db.ExecuteSqlRawAsync(
                "DELETE FROM \"Reviews\" WHERE \"BusinessId\" = ANY(@p0)", businessIds, cancellationToken);
        }

        var tenantIdTables = new[]
        {
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
        };

        foreach (var table in tenantIdTables)
        {
            await db.ExecuteSqlRawAsync(
                $"DELETE FROM \"{table}\" WHERE \"TenantId\" = @p0", tenantId, cancellationToken);
        }

        _context.Tenants.Remove(tenant);
        await ((DbContext)_context).SaveChangesAsync(cancellationToken);
    }
}

public class DeleteTenantCommandValidator : AbstractValidator<DeleteTenantCommand>
{
    public DeleteTenantCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
