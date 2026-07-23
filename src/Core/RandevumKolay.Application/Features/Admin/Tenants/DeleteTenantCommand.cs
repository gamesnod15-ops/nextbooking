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
            "win_back_send_logs", "win_back_rules", "whatsapp_messages", "whatsapp_conversations",
            "whatsapp_booking_drafts", "whatsapp_integrations", "surveys", "form_submissions",
            "custom_forms", "no_show_predictions", "loyalty_redemptions", "loyalty_rewards",
            "loyalty_members", "loyalty_tiers", "ai_usage_records", "queue_items",
            "waiting_list_entries", "product_purchases", "payment_cards",
            "deposits", "debt_records", "installments", "receivables", "products",
            "gift_coupons", "campaigns", "coupons", "packages", "employee_commissions",
            "advertisements", "branches", "employee_services", "schedules",
            "schedule_exceptions", "services", "payments", "audit_logs",
            "platform_payments", "feedbacks",
            "appointments", "employees", "customers", "users", "businesses"
        ];

        foreach (var table in tenantIdTables)
        {
            await db.ExecuteSqlRawAsync(
                $"DELETE FROM \"{table}\" WHERE \"TenantId\" = @p0",
                new object[] { tid },
                cancellationToken);
        }

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"reviews\" WHERE \"BusinessId\" IN (SELECT \"Id\" FROM \"businesses\" WHERE \"TenantId\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"refresh_tokens\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"users\" WHERE \"TenantId\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"user_auth_providers\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"users\" WHERE \"TenantId\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"tenants\" WHERE \"Id\" = @p0",
            new object[] { tid },
            cancellationToken);
    }
}

public class DeleteTenantCommandValidator : AbstractValidator<DeleteTenantCommand>
{
    public DeleteTenantCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
