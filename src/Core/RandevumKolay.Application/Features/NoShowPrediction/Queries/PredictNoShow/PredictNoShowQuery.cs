using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.NoShowPrediction.Queries.PredictNoShow;

public record PredictNoShowQuery(
    Guid AppointmentId,
    Guid CustomerId) : IRequest<PredictNoShowResult>;

public record PredictNoShowResult(
    decimal Probability,
    string RiskLevel,
    bool RequiresDeposit,
    decimal? RecommendedDepositAmount,
    string? Factors);

public sealed class PredictNoShowQueryHandler
    : IRequestHandler<PredictNoShowQuery, PredictNoShowResult>
{
    private readonly INoShowPredictionService _predictionService;
    private readonly ICurrentTenantService _tenantService;

    public PredictNoShowQueryHandler(
        INoShowPredictionService predictionService,
        ICurrentTenantService tenantService)
    {
        _predictionService = predictionService;
        _tenantService = tenantService;
    }

    public async Task<PredictNoShowResult> Handle(
        PredictNoShowQuery request,
        CancellationToken cancellationToken)
    {
        var result = await _predictionService.PredictNoShowAsync(
            _tenantService.TenantId,
            request.AppointmentId,
            request.CustomerId,
            cancellationToken);

        return new PredictNoShowResult(
            result.Probability,
            result.RiskLevel,
            result.RequiresDeposit,
            result.RecommendedDepositAmount,
            result.Factors);
    }
}
