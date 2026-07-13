namespace RandevumKolay.Application.Common.Interfaces;

public record NoShowPredictionResult(
    decimal Probability,
    string RiskLevel,
    bool RequiresDeposit,
    decimal? RecommendedDepositAmount,
    string? Factors);

public interface INoShowPredictionService
{
    Task<NoShowPredictionResult> PredictNoShowAsync(
        Guid tenantId, Guid appointmentId, Guid customerId, CancellationToken ct = default);

    Task<NoShowPredictionResult> PredictNoShowForAppointmentAsync(
        Guid tenantId, DateTimeOffset appointmentStart, Guid customerId,
        Guid? serviceId = null, CancellationToken ct = default);

    Task UpdateActualOutcomeAsync(Guid predictionId, bool noShow, CancellationToken ct = default);
}
