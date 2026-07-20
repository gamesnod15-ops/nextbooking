using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Loyalty;

internal static class LoyaltyTierHelper
{
    public static async Task<List<LoyaltyTier>> GetOrSeedTiersAsync(
        IApplicationDbContext context, Guid tenantId, CancellationToken cancellationToken)
    {
        var tiers = await context.LoyaltyTiers
            .Where(t => t.TenantId == tenantId)
            .OrderBy(t => t.SortOrder)
            .ToListAsync(cancellationToken);

        if (tiers.Count == 0)
        {
            tiers = LoyaltyTier.CreateDefaults(tenantId);
            context.LoyaltyTiers.AddRange(tiers);
            await context.SaveChangesAsync(cancellationToken);
        }

        return tiers;
    }

    public static LoyaltyTier CurrentTier(List<LoyaltyTier> tiers, int points) =>
        tiers.Where(t => points >= t.MinPoints).OrderByDescending(t => t.MinPoints).First();
}
