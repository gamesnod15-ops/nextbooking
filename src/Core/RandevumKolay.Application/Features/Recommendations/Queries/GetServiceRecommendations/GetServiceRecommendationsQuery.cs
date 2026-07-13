using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Recommendations.Queries.GetServiceRecommendations;

public record GetServiceRecommendationsQuery(
    Guid CustomerId,
    int Count = 5) : IRequest<List<RecommendationDto>>;

public record RecommendationDto(
    Guid Id,
    string Title,
    string? Description,
    string Type,
    Guid? RecommendedServiceId,
    string? ServiceName,
    Guid? RecommendedProductId,
    string? ProductName,
    decimal RelevanceScore,
    string? Reason,
    bool IsViewed,
    DateTimeOffset CreatedAt);

public sealed class GetServiceRecommendationsQueryHandler
    : IRequestHandler<GetServiceRecommendationsQuery, List<RecommendationDto>>
{
    private readonly IRecommendationService _recommendationService;
    private readonly ICurrentTenantService _tenantService;

    public GetServiceRecommendationsQueryHandler(
        IRecommendationService recommendationService,
        ICurrentTenantService tenantService)
    {
        _recommendationService = recommendationService;
        _tenantService = tenantService;
    }

    public async Task<List<RecommendationDto>> Handle(
        GetServiceRecommendationsQuery request,
        CancellationToken cancellationToken)
    {
        var recommendations = await _recommendationService.GetServiceRecommendationsAsync(
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
