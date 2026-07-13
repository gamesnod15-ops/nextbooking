using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Advertisements.Queries.GetAdvertisements;

public record GetAdvertisementsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    AdStatus? Status = null) : IRequest<PaginatedList<AdvertisementDto>>;

public record AdvertisementDto(
    Guid Id,
    string Title,
    string? Description,
    string PackageType,
    string TargetCategory,
    string? TargetLocation,
    decimal Budget,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string Status,
    int Impressions,
    int Clicks,
    int Conversions,
    DateTimeOffset CreatedAt);

public sealed class GetAdvertisementsQueryHandler
    : IRequestHandler<GetAdvertisementsQuery, PaginatedList<AdvertisementDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetAdvertisementsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<AdvertisementDto>> Handle(
        GetAdvertisementsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Advertisements
            .AsNoTracking()
            .Where(a => a.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(a => a.Status == request.Status.Value);

        var projected = query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AdvertisementDto(
                a.Id,
                a.Title,
                a.Description,
                a.PackageType.ToString(),
                a.TargetCategory.ToString(),
                a.TargetLocation,
                a.Budget,
                a.StartDate,
                a.EndDate,
                a.Status.ToString(),
                a.Impressions,
                a.Clicks,
                a.Conversions,
                a.CreatedAt));

        return await PaginatedList<AdvertisementDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
