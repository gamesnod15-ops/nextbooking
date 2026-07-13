using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Common.Interfaces;

public interface IRecommendationService
{
    Task<List<CustomerRecommendation>> GetServiceRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default);

    Task<List<CustomerRecommendation>> GetProductRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default);

    Task<List<CustomerRecommendation>> GetTimelyRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default);

    Task<List<CustomerRecommendation>> GetAllRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 10, CancellationToken ct = default);

    Task GenerateAndStoreRecommendationsAsync(
        Guid tenantId, Guid customerId, CancellationToken ct = default);
}
