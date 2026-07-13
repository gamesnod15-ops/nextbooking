using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.ScheduleOptimization.Queries.GetOptimizationSuggestions;

public record GetOptimizationSuggestionsQuery(
    DateOnly StartDate,
    DateOnly EndDate) : IRequest<List<ScheduleSuggestionDto>>;

public record ScheduleSuggestionDto(
    Guid EmployeeId,
    string EmployeeName,
    DateOnly Date,
    string SuggestedStart,
    string SuggestedEnd,
    string Reason,
    int ExpectedDemandScore);

public sealed class GetOptimizationSuggestionsQueryHandler
    : IRequestHandler<GetOptimizationSuggestionsQuery, List<ScheduleSuggestionDto>>
{
    private readonly IScheduleOptimizationService _optimizationService;
    private readonly ICurrentTenantService _tenantService;

    public GetOptimizationSuggestionsQueryHandler(
        IScheduleOptimizationService optimizationService,
        ICurrentTenantService tenantService)
    {
        _optimizationService = optimizationService;
        _tenantService = tenantService;
    }

    public async Task<List<ScheduleSuggestionDto>> Handle(
        GetOptimizationSuggestionsQuery request,
        CancellationToken cancellationToken)
    {
        var suggestions = await _optimizationService.GetScheduleOptimizationsAsync(
            _tenantService.TenantId, request.StartDate, request.EndDate, cancellationToken);

        return suggestions.Select(s => new ScheduleSuggestionDto(
            s.EmployeeId,
            s.EmployeeName,
            s.Date,
            s.SuggestedStart.ToString("HH:mm"),
            s.SuggestedEnd.ToString("HH:mm"),
            s.Reason,
            s.ExpectedDemandScore)).ToList();
    }
}
