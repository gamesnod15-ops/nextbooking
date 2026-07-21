using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// One row per tenant per calendar month — tracks how many customer messages
/// were answered by the paid Claude API this month (the free-tier quota
/// counter) plus the real token usage/cost behind them. The fallback
/// automation path never increments this — it costs nothing.
/// </summary>
public class AiUsageRecord : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public DateOnly PeriodStart { get; private set; }
    public int MessageCount { get; private set; }
    public long InputTokens { get; private set; }
    public long OutputTokens { get; private set; }
    public decimal EstimatedCostUsd { get; private set; }

    private AiUsageRecord() { }

    public static AiUsageRecord Create(Guid tenantId, DateOnly periodStart) => new()
    {
        TenantId = tenantId,
        PeriodStart = periodStart,
    };

    public void RecordUsage(int inputTokens, int outputTokens, decimal costUsd)
    {
        MessageCount++;
        InputTokens += inputTokens;
        OutputTokens += outputTokens;
        EstimatedCostUsd += costUsd;
    }
}
