using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.ScheduleOptimization.Queries.GetOverbookingSuggestions;

public record GetOverbookingSuggestionsQuery(
    DateOnly Date) : IRequest<List<OverbookingSuggestionDto>>;

public record OverbookingSuggestionDto(
    Guid AppointmentId,
    string CustomerName,
    string ServiceName,
    DateTimeOffset AppointmentStart,
    decimal NoShowProbability,
    string RiskLevel,
    string Suggestion);

public sealed class GetOverbookingSuggestionsQueryHandler
    : IRequestHandler<GetOverbookingSuggestionsQuery, List<OverbookingSuggestionDto>>
{
    private readonly IScheduleOptimizationService _optimizationService;
    private readonly ICurrentTenantService _tenantService;

    public GetOverbookingSuggestionsQueryHandler(
        IScheduleOptimizationService optimizationService,
        ICurrentTenantService tenantService)
    {
        _optimizationService = optimizationService;
        _tenantService = tenantService;
    }

    public async Task<List<OverbookingSuggestionDto>> Handle(
        GetOverbookingSuggestionsQuery request,
        CancellationToken cancellationToken)
    {
        var suggestions = await _optimizationService.GetOverbookingSuggestionsAsync(
            _tenantService.TenantId, request.Date, cancellationToken);

        return suggestions.Select(s => new OverbookingSuggestionDto(
            s.AppointmentId,
            "",
            "",
            DateTimeOffset.MinValue,
            s.NoShowProbability,
            s.RiskLevel,
            s.Suggestion)).ToList();
    }
}
