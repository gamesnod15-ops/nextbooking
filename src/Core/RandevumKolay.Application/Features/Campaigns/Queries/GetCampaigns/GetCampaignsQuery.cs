using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Campaigns.Queries.GetCampaigns;

public record GetCampaignsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    CampaignStatus? Status = null,
    string? SearchTerm = null) : IRequest<PaginatedList<CampaignDto>>;

public record CampaignDto(
    Guid Id,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    CampaignStatus Status,
    int? UsageLimit,
    int UsageCount,
    List<Guid> ApplicableServiceIds,
    DateTimeOffset CreatedAt);

public sealed class GetCampaignsQueryHandler : IRequestHandler<GetCampaignsQuery, PaginatedList<CampaignDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetCampaignsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<CampaignDto>> Handle(GetCampaignsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Campaigns
            .AsNoTracking()
            .Where(c => c.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(c => c.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term));
        }

        var projected = query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CampaignDto(
                c.Id, c.Name, c.Description, c.DiscountType, c.DiscountValue,
                c.StartDate, c.EndDate, c.Status, c.UsageLimit, c.UsageCount,
                c.ApplicableServiceIds, c.CreatedAt));

        return await PaginatedList<CampaignDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
