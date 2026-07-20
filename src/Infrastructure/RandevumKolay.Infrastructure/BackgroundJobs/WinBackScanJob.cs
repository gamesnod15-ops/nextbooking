using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure.BackgroundJobs;

/// <summary>
/// Daily scan: for each tenant's active win-back rules, finds customers who've
/// gone quiet past the rule's threshold and sends them a nudge (SMS/email).
/// A rule is "due" for a customer when no WinBackSendLog for that rule exists
/// with SentAt after the customer's current LastVisitAt — this needs no log
/// cleanup, since a later visit naturally moves LastVisitAt past old logs.
/// </summary>
public class WinBackScanJob : IWinBackScanJob
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<WinBackScanJob> _logger;

    public WinBackScanJob(
        IApplicationDbContext context,
        INotificationService notificationService,
        ILogger<WinBackScanJob> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var tenantIds = await _context.Tenants
            .Where(t => t.IsActive)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        foreach (var tenantId in tenantIds)
        {
            var rules = await _context.WinBackRules
                .Where(r => r.TenantId == tenantId && r.IsActive)
                .ToListAsync(cancellationToken);
            if (rules.Count == 0) continue;

            var candidates = await _context.Customers
                .Where(c => c.TenantId == tenantId && !c.IsBlocked && c.LastVisitAt != null)
                .ToListAsync(cancellationToken);
            if (candidates.Count == 0) continue;

            var sentCount = 0;
            foreach (var rule in rules)
            {
                var cutoff = now.AddDays(-rule.DaysSinceLastVisit);
                foreach (var customer in candidates.Where(c => c.LastVisitAt <= cutoff))
                {
                    var alreadySent = await _context.WinBackSendLogs.AnyAsync(l =>
                        l.CustomerId == customer.Id && l.RuleId == rule.Id && l.SentAt > customer.LastVisitAt!.Value,
                        cancellationToken);
                    if (alreadySent) continue;

                    await _notificationService.SendWinBackMessageAsync(customer.Id, rule.MessageTemplate, cancellationToken);
                    _context.WinBackSendLogs.Add(Domain.Entities.WinBackSendLog.Create(tenantId, customer.Id, rule.Id));
                    sentCount++;
                }
            }

            if (sentCount > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Win-back scan: {Count} mesaj gönderildi (tenant {TenantId}).", sentCount, tenantId);
            }
        }
    }
}
