namespace RandevumKolay.Application.Common.Interfaces;

public record ScheduleSuggestion(
    Guid EmployeeId,
    string EmployeeName,
    DateOnly Date,
    TimeOnly SuggestedStart,
    TimeOnly SuggestedEnd,
    string Reason,
    int ExpectedDemandScore);

public record OverbookingSuggestion(
    Guid AppointmentId,
    decimal NoShowProbability,
    string RiskLevel,
    string Suggestion);

public interface IScheduleOptimizationService
{
    Task<List<ScheduleSuggestion>> GetScheduleOptimizationsAsync(
        Guid tenantId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default);

    Task<List<OverbookingSuggestion>> GetOverbookingSuggestionsAsync(
        Guid tenantId, DateOnly date, CancellationToken ct = default);

    Task<List<ScheduleSuggestion>> GetDemandForecastAsync(
        Guid tenantId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default);
}
