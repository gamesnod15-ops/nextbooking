using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Infrastructure.AI;

public class AiUsageService : IAiUsageService
{
    // Anthropic's intro pricing for claude-sonnet-5, valid through 2026-08-31;
    // rises to $3/$15 per 1M tokens after that — update these two constants then.
    private const decimal InputPricePerMillion = 2.0m;
    private const decimal OutputPricePerMillion = 10.0m;

    private readonly IApplicationDbContext _context;

    public AiUsageService(IApplicationDbContext context) => _context = context;

    public async Task<bool> HasQuotaRemainingAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var record = await _context.AiUsageRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.PeriodStart == CurrentPeriodStart(), cancellationToken);

        return (record?.MessageCount ?? 0) < AiUsageConstants.FreeMessagesPerMonth;
    }

    public async Task RecordUsageAsync(Guid tenantId, int inputTokens, int outputTokens, CancellationToken cancellationToken = default)
    {
        var periodStart = CurrentPeriodStart();
        var record = await _context.AiUsageRecords
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.PeriodStart == periodStart, cancellationToken);

        if (record is null)
        {
            record = AiUsageRecord.Create(tenantId, periodStart);
            _context.AiUsageRecords.Add(record);
        }

        var costUsd = inputTokens / 1_000_000m * InputPricePerMillion + outputTokens / 1_000_000m * OutputPricePerMillion;
        record.RecordUsage(inputTokens, outputTokens, costUsd);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static DateOnly CurrentPeriodStart()
    {
        var now = DateTimeOffset.UtcNow;
        return new DateOnly(now.Year, now.Month, 1);
    }
}
