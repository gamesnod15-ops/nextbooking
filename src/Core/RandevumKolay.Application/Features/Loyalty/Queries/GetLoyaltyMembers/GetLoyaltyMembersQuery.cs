using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;

namespace RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyMembers;

public record GetLoyaltyMembersQuery(int PageNumber = 1, int PageSize = 20) : IRequest<PaginatedList<LoyaltyMemberDto>>;

public record LoyaltyMemberDto(
    Guid Id,
    Guid CustomerId,
    string Name,
    string Phone,
    int Points,
    decimal TotalSpent,
    int Visits,
    Guid TierId,
    DateTimeOffset JoinedAt,
    DateTimeOffset? LastVisit);

internal record LoyaltyMemberRow(
    Guid Id,
    Guid CustomerId,
    string Name,
    string Phone,
    int Points,
    decimal TotalSpent,
    int TotalVisits,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastVisitAt);

public sealed class GetLoyaltyMembersQueryHandler : IRequestHandler<GetLoyaltyMembersQuery, PaginatedList<LoyaltyMemberDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetLoyaltyMembersQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<LoyaltyMemberDto>> Handle(GetLoyaltyMembersQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var tiers = await LoyaltyTierHelper.GetOrSeedTiersAsync(_context, tenantId, cancellationToken);

        var query = _context.LoyaltyMembers
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .Join(_context.Customers, m => m.CustomerId, c => c.Id, (m, c) => new { m, c })
            .OrderByDescending(x => x.m.Points)
            .Select(x => new LoyaltyMemberRow(
                x.m.Id, x.m.CustomerId, x.c.Name, x.c.Phone, x.m.Points, x.c.TotalSpent, x.c.TotalVisits, x.m.CreatedAt, x.c.LastVisitAt));

        var page = await PaginatedList<LoyaltyMemberRow>.CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken);

        var items = page.Items.Select(x =>
        {
            var tier = LoyaltyTierHelper.CurrentTier(tiers, x.Points);
            return new LoyaltyMemberDto(
                x.Id, x.CustomerId, x.Name, x.Phone, x.Points, x.TotalSpent, x.TotalVisits, tier.Id, x.CreatedAt, x.LastVisitAt);
        }).ToList();

        return new PaginatedList<LoyaltyMemberDto>(items, page.TotalCount, request.PageNumber, request.PageSize);
    }
}
