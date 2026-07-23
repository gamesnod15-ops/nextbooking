using System.Text.Json;
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
        var ctx = (DbContext)_context;
        var db = ctx.Database;

        await DeleteFilesForTenant(ctx, tid, cancellationToken);

        string[] tenantIdTables =
        [
            "win_back_send_logs", "win_back_rules", "whatsapp_messages", "whatsapp_conversations",
            "whatsapp_booking_drafts", "whatsapp_integrations", "surveys", "form_submissions",
            "custom_forms", "loyalty_redemptions", "loyalty_rewards", "loyalty_members", "loyalty_tiers",
            "ai_usage_records", "queue_items", "waiting_list_entries", "product_purchases",
            "payment_cards", "debt_records", "installments", "receivables",
            "gift_coupons", "campaigns", "coupons", "packages",
            "employee_commissions", "advertisements", "branches", "schedules",
            "schedule_exceptions", "payments", "audit_logs", "platform_payments",
            "feedbacks", "users",
            "no_show_predictions", "deposits",
            "customer_recommendations",
            "appointments",
            "products", "services", "employees", "customers",
            "businesses"
        ];

        foreach (var table in tenantIdTables)
        {
            await db.ExecuteSqlRawAsync(
                $"DELETE FROM \"{table}\" WHERE \"tenant_id\" = @p0",
                new object[] { tid },
                cancellationToken);
        }

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"reviews\" WHERE \"business_id\" IN (SELECT \"id\" FROM \"businesses\" WHERE \"tenant_id\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"refresh_tokens\" WHERE \"user_id\" IN (SELECT \"id\" FROM \"users\" WHERE \"tenant_id\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"user_auth_providers\" WHERE \"user_id\" IN (SELECT \"id\" FROM \"users\" WHERE \"tenant_id\" = @p0)",
            new object[] { tid },
            cancellationToken);

        await db.ExecuteSqlRawAsync(
            "DELETE FROM \"tenants\" WHERE \"id\" = @p0",
            new object[] { tid },
            cancellationToken);
    }

    private static async Task DeleteFilesForTenant(
        DbContext ctx,
        Guid tid,
        CancellationToken ct)
    {
        var uploadsDir = ResolveUploadsDirectory();
        if (uploadsDir is null) return;

        var urls = new List<string>();

        var conn = ctx.Database.GetDbConnection();
        var wasOpen = conn.State == System.Data.ConnectionState.Open;
        if (!wasOpen) await conn.OpenAsync(ct);

        try
        {
            string[] urlQueries =
            [
                "SELECT \"LogoUrl\" FROM \"tenants\" WHERE \"Id\" = @p0 AND \"LogoUrl\" IS NOT NULL",
                "SELECT \"LogoUrl\" FROM \"businesses\" WHERE \"tenant_id\" = @p0 AND \"LogoUrl\" IS NOT NULL",
                "SELECT \"CoverImageUrl\" FROM \"businesses\" WHERE \"tenant_id\" = @p0 AND \"CoverImageUrl\" IS NOT NULL",
                "SELECT \"AvatarUrl\" FROM \"employees\" WHERE \"tenant_id\" = @p0 AND \"AvatarUrl\" IS NOT NULL",
                "SELECT \"ImageUrl\" FROM \"services\" WHERE \"tenant_id\" = @p0 AND \"ImageUrl\" IS NOT NULL",
                "SELECT \"AvatarUrl\" FROM \"customers\" WHERE \"tenant_id\" = @p0 AND \"AvatarUrl\" IS NOT NULL",
                "SELECT \"ImageUrl\" FROM \"packages\" WHERE \"tenant_id\" = @p0 AND \"ImageUrl\" IS NOT NULL",
                "SELECT \"ImageUrls\" FROM \"feedbacks\" WHERE \"tenant_id\" = @p0 AND \"ImageUrls\" IS NOT NULL",
                "SELECT \"AvatarUrl\" FROM \"users\" WHERE \"tenant_id\" = @p0 AND \"AvatarUrl\" IS NOT NULL",
            ];

            foreach (var sql in urlQueries)
            {
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = sql;
                var p = cmd.CreateParameter();
                p.ParameterName = "@p0";
                p.Value = tid;
                cmd.Parameters.Add(p);

                await using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var val = reader.IsDBNull(0) ? null : reader.GetString(0);
                    if (string.IsNullOrWhiteSpace(val)) continue;

                    if (val.StartsWith('['))
                    {
                        try
                        {
                            var arr = JsonSerializer.Deserialize<List<string>>(val);
                            if (arr is not null) urls.AddRange(arr);
                        }
                        catch { urls.Add(val); }
                    }
                    else if (val.Contains(','))
                    {
                        urls.AddRange(val.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
                    }
                    else
                    {
                        urls.Add(val);
                    }
                }
            }

            foreach (var url in urls)
            {
                var relative = ExtractRelativePath(url);
                if (relative is null) continue;

                var fullPath = Path.Combine(uploadsDir, relative);
                try
                {
                    if (File.Exists(fullPath)) File.Delete(fullPath);
                }
                catch { /* best-effort */ }
            }
        }
        finally
        {
            if (!wasOpen) await conn.CloseAsync();
        }
    }

    private static string? ResolveUploadsDirectory()
    {
        var envDir = Environment.GetEnvironmentVariable("UPLOADS_DIR");
        if (!string.IsNullOrEmpty(envDir))
            return Path.Combine(envDir, "uploads");

        var cwd = Directory.GetCurrentDirectory();
        var devPath = Path.Combine(cwd, "wwwroot", "uploads");
        if (Directory.Exists(devPath)) return devPath;

        var prodPath = "/home/uploads";
        if (Directory.Exists(prodPath)) return prodPath;

        return null;
    }

    private static string? ExtractRelativePath(string url)
    {
        try
        {
            var uri = new Uri(url);
            var path = uri.AbsolutePath;
            if (path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
                return path["/uploads/".Length..].TrimStart('/');

            if (path.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase))
                return path["/uploads".Length..].TrimStart('/');

            return null;
        }
        catch { return null; }
    }
}

public class DeleteTenantCommandValidator : AbstractValidator<DeleteTenantCommand>
{
    public DeleteTenantCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
