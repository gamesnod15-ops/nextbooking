using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.AiUsage.Queries.GetAiUsage;

public record GetAiUsageQuery : IRequest<AiUsageSummaryDto>;

public record AiUsageSummaryDto(int MessageCount, int FreeLimit, long InputTokens, long OutputTokens, decimal EstimatedCostUsd);

public sealed class GetAiUsageQueryHandler : IRequestHandler<GetAiUsageQuery, AiUsageSummaryDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetAiUsageQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<AiUsageSummaryDto> Handle(GetAiUsageQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var periodStart = new DateOnly(now.Year, now.Month, 1);

        var record = await _context.AiUsageRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.TenantId == _tenantService.TenantId && r.PeriodStart == periodStart, cancellationToken);

        return new AiUsageSummaryDto(
            record?.MessageCount ?? 0,
            AiUsageConstants.FreeMessagesPerMonth,
            record?.InputTokens ?? 0,
            record?.OutputTokens ?? 0,
            record?.EstimatedCostUsd ?? 0m);
    }
}
