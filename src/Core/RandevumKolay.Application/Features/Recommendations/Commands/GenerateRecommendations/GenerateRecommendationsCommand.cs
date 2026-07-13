using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Recommendations.Commands.GenerateRecommendations;

public record GenerateRecommendationsCommand(Guid CustomerId) : IRequest;

public sealed class GenerateRecommendationsCommandHandler
    : IRequestHandler<GenerateRecommendationsCommand>
{
    private readonly IRecommendationService _recommendationService;
    private readonly ICurrentTenantService _tenantService;

    public GenerateRecommendationsCommandHandler(
        IRecommendationService recommendationService,
        ICurrentTenantService tenantService)
    {
        _recommendationService = recommendationService;
        _tenantService = tenantService;
    }

    public async Task Handle(GenerateRecommendationsCommand request, CancellationToken cancellationToken)
    {
        await _recommendationService.GenerateAndStoreRecommendationsAsync(
            _tenantService.TenantId, request.CustomerId, cancellationToken);
    }
}
