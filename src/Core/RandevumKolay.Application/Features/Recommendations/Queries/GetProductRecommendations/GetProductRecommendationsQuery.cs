using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Features.Recommendations.Queries.GetServiceRecommendations;

namespace RandevumKolay.Application.Features.Recommendations.Queries.GetProductRecommendations;

public record GetProductRecommendationsQuery(
    Guid CustomerId,
    int Count = 5) : IRequest<List<RecommendationDto>>;

public sealed class GetProductRecommendationsQueryHandler
    : IRequestHandler<GetProductRecommendationsQuery, List<RecommendationDto>>
{
    private readonly IRecommendationService _recommendationService;
    private readonly ICurrentTenantService _tenantService;

    public GetProductRecommendationsQueryHandler(
        IRecommendationService recommendationService,
        ICurrentTenantService tenantService)
    {
        _recommendationService = recommendationService;
        _tenantService = tenantService;
    }

    public async Task<List<RecommendationDto>> Handle(
        GetProductRecommendationsQuery request,
        CancellationToken cancellationToken)
    {
        var recommendations = await _recommendationService.GetProductRecommendationsAsync(
            _tenantService.TenantId, request.CustomerId, request.Count, cancellationToken);

        return recommendations.Select(r => new RecommendationDto(
            r.Id,
            r.Title,
            r.Description,
            r.RecommendationType.ToString(),
            r.RecommendedServiceId,
            r.RecommendedService?.Name,
            r.RecommendedProductId,
            r.RecommendedProduct?.Name,
            r.RelevanceScore,
            r.Reason,
            r.IsViewed,
            r.CreatedAt)).ToList();
    }
}
