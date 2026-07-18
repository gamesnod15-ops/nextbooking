using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Payments;

/// <summary>
/// There is no automated billing job yet — <c>ChangePlanCommand</c> only updates
/// the tenant's <c>Plan</c> field, no money actually moves anywhere, and most
/// tenants pick their plan directly at registration rather than through the
/// separate checkout flow, so <c>SubscriptionEndsAt</c> is unreliable as a
/// "did they pay" signal. This command backfills/refreshes the platform payment
/// ledger from plan state instead: every active tenant not on the free/default
/// "starter" plan gets one "Paid" subscription entry per calendar month, so the
/// manager panel's payments list and dashboard revenue reflect reality.
/// Safe to run repeatedly — skips tenants that already have an entry this month.
/// </summary>
public record SyncSubscriptionPaymentsCommand : IRequest<SyncSubscriptionPaymentsResult>;

public record SyncSubscriptionPaymentsResult(int Created, int Skipped);

public sealed class SyncSubscriptionPaymentsCommandHandler : IRequestHandler<SyncSubscriptionPaymentsCommand, SyncSubscriptionPaymentsResult>
{
    // Mirrors frontend/bussines-panel/src/config/plans.ts — no backend pricing table exists yet.
    // "starter" is the free/default plan every tenant starts on, so it's excluded.
    // "custom" has no fixed price (negotiated per deal), also excluded from auto-sync.
    private static readonly Dictionary<string, decimal> PlanPrices = new(StringComparer.OrdinalIgnoreCase)
    {
        ["business"] = 599m,
        ["professional"] = 999m,
    };

    private readonly IApplicationDbContext _context;

    public SyncSubscriptionPaymentsCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<SyncSubscriptionPaymentsResult> Handle(SyncSubscriptionPaymentsCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

        var tenants = await _context.Tenants.AsNoTracking()
            .Where(t => t.IsActive)
            .ToListAsync(cancellationToken);

        var tenantIds = tenants.Select(t => t.Id).ToList();

        var businesses = await _context.Businesses.AsNoTracking()
            .Where(b => tenantIds.Contains(b.TenantId))
            .OrderBy(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
        var businessByTenant = businesses.GroupBy(b => b.TenantId).ToDictionary(g => g.Key, g => g.First());

        var alreadyBilledThisMonth = (await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Type == PlatformPaymentType.Subscription && p.TenantId != null && p.CreatedAt >= monthStart)
            .Select(p => p.TenantId!.Value)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        var created = 0;
        var skipped = 0;
        var monthLabel = now.ToString("MMMM yyyy", new CultureInfo("tr-TR"));

        foreach (var tenant in tenants)
        {
            if (alreadyBilledThisMonth.Contains(tenant.Id) || !PlanPrices.TryGetValue(tenant.Plan, out var price))
            {
                skipped++;
                continue;
            }

            businessByTenant.TryGetValue(tenant.Id, out var business);
            var planLabel = CultureInfo.InvariantCulture.TextInfo.ToTitleCase(tenant.Plan);

            var payment = PlatformPayment.Create(
                PlatformPaymentType.Subscription,
                business?.Name ?? tenant.Name,
                price,
                "TRY",
                tenant.Id,
                $"{planLabel} Plan - {monthLabel}",
                PlatformPaymentStatus.Paid,
                business?.Address,
                business?.City,
                business?.Country,
                business?.TaxNumber,
                business?.TaxOffice);

            _context.PlatformPayments.Add(payment);
            created++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new SyncSubscriptionPaymentsResult(created, skipped);
    }
}
