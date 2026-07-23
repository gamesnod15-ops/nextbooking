using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Tenants;

public record CleanupSoftDeletesCommand : IRequest<CleanupSoftDeletesResult>;

public record CleanupSoftDeletesResult(int Deleted);

public sealed class CleanupSoftDeletesCommandHandler : IRequestHandler<CleanupSoftDeletesCommand, CleanupSoftDeletesResult>
{
    private readonly IApplicationDbContext _context;

    public CleanupSoftDeletesCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CleanupSoftDeletesResult> Handle(CleanupSoftDeletesCommand request, CancellationToken cancellationToken)
    {
        string[] tables =
        [
            "feedbacks", "appointments", "payments", "deposits", "no_show_predictions",
            "loyalty_redemptions", "loyalty_members", "form_submissions",
            "surveys", "whatsapp_booking_drafts",
            "whatsapp_messages", "whatsapp_conversations",
            "win_back_send_logs", "queue_items", "waiting_list_entries",
            "product_purchases", "installments", "debt_records",
            "schedules", "schedule_exceptions", "employee_commissions",
            "audit_logs", "platform_payments", "payment_cards", "advertisements",
            "gift_coupons", "campaigns", "coupons", "packages", "products",
            "receivables", "custom_forms", "loyalty_rewards", "loyalty_tiers",
            "ai_usage_records", "whatsapp_integrations", "win_back_rules",
            "branches", "services", "employees",
            "customers", "businesses", "users", "tenants"
        ];

        var db = ((DbContext)_context).Database;
        var totalDeleted = 0;
        foreach (var table in tables)
        {
            try
            {
                totalDeleted += await db.ExecuteSqlRawAsync(
                    $"DELETE FROM \"{table}\" WHERE \"is_deleted\" = true",
                    cancellationToken);
            }
            catch (Exception)
            {
                continue;
            }
        }
        return new CleanupSoftDeletesResult(totalDeleted);
    }
}
