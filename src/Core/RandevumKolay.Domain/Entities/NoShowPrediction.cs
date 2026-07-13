using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class NoShowPrediction : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public Guid CustomerId { get; private set; }
    public decimal Probability { get; private set; }
    public string RiskLevel { get; private set; } = "Low";
    public string? Factors { get; private set; }
    public bool RequiresDeposit { get; private set; }
    public decimal? RecommendedDepositAmount { get; private set; }
    public bool? ActualNoShow { get; private set; }
    public DateTimeOffset PredictedAt { get; private set; }

    public Appointment? Appointment { get; private set; }
    public Customer? Customer { get; private set; }

    private NoShowPrediction() { }

    public static NoShowPrediction Create(
        Guid tenantId,
        Guid appointmentId,
        Guid customerId,
        decimal probability,
        string riskLevel,
        string? factors = null,
        bool requiresDeposit = false,
        decimal? recommendedDepositAmount = null)
    {
        return new NoShowPrediction
        {
            TenantId = tenantId,
            AppointmentId = appointmentId,
            CustomerId = customerId,
            Probability = probability,
            RiskLevel = riskLevel,
            Factors = factors,
            RequiresDeposit = requiresDeposit,
            RecommendedDepositAmount = recommendedDepositAmount,
            PredictedAt = DateTimeOffset.UtcNow
        };
    }

    public void MarkActualNoShow(bool noShow)
    {
        ActualNoShow = noShow;
    }
}
