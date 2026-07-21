namespace RandevumKolay.Application.Common.Interfaces;

public static class AiUsageConstants
{
    /// Flat free-tier quota per tenant per calendar month — after this many
    /// Claude-answered customer messages, the fallback automation takes over.
    public const int FreeMessagesPerMonth = 200;
}

public interface IAiUsageService
{
    Task<bool> HasQuotaRemainingAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task RecordUsageAsync(Guid tenantId, int inputTokens, int outputTokens, CancellationToken cancellationToken = default);
}
