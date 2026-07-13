using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.NoShowPrediction.Queries.GetNoShowPredictions;

public record GetNoShowPredictionsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? RiskLevel = null,
    bool? RequiresDeposit = null) : IRequest<NoShowPredictionListResult>;

public record NoShowPredictionListResult(
    List<NoShowPredictionItem> Items,
    int TotalCount,
    int TotalPages);

public record NoShowPredictionItem(
    Guid Id,
    string CustomerName,
    string CustomerPhone,
    string ServiceName,
    DateTimeOffset AppointmentStart,
    decimal Probability,
    string RiskLevel,
    bool RequiresDeposit,
    bool? ActualNoShow,
    DateTimeOffset PredictedAt);

public sealed class GetNoShowPredictionsQueryHandler
    : IRequestHandler<GetNoShowPredictionsQuery, NoShowPredictionListResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetNoShowPredictionsQueryHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<NoShowPredictionListResult> Handle(
        GetNoShowPredictionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.NoShowPredictions
            .AsNoTracking()
            .Where(p => p.TenantId == _tenantService.TenantId && !p.IsDeleted)
            .Include(p => p.Appointment).ThenInclude(a => a!.Service)
            .Include(p => p.Customer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.RiskLevel))
            query = query.Where(p => p.RiskLevel == request.RiskLevel);

        if (request.RequiresDeposit.HasValue)
            query = query.Where(p => p.RequiresDeposit == request.RequiresDeposit.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var items = await query
            .OrderByDescending(p => p.Probability)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new NoShowPredictionItem(
                p.Id,
                p.Customer!.Name,
                p.Customer.Phone,
                p.Appointment!.Service!.Name,
                p.Appointment.StartTime,
                p.Probability,
                p.RiskLevel,
                p.RequiresDeposit,
                p.ActualNoShow,
                p.PredictedAt))
            .ToListAsync(cancellationToken);

        return new NoShowPredictionListResult(items, totalCount, totalPages);
    }
}
