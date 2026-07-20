using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WinBackRules.Queries.GetWinBackRules;

public record GetWinBackRulesQuery : IRequest<List<WinBackRuleDto>>;

public record WinBackRuleDto(
    Guid Id,
    int DaysSinceLastVisit,
    string MessageTemplate,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed class GetWinBackRulesQueryHandler : IRequestHandler<GetWinBackRulesQuery, List<WinBackRuleDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetWinBackRulesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<WinBackRuleDto>> Handle(GetWinBackRulesQuery request, CancellationToken cancellationToken)
    {
        return await _context.WinBackRules
            .AsNoTracking()
            .Where(r => r.TenantId == _tenantService.TenantId)
            .OrderBy(r => r.DaysSinceLastVisit)
            .Select(r => new WinBackRuleDto(r.Id, r.DaysSinceLastVisit, r.MessageTemplate, r.IsActive, r.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
