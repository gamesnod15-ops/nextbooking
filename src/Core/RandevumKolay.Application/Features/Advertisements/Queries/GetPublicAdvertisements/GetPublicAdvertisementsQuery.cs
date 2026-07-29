using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Advertisements.Queries.GetPublicAdvertisements;

public record GetPublicAdvertisementsQuery(int Count = 10) : IRequest<List<PublicAdDto>>;

public record PublicAdDto(
    Guid Id,
    Guid BusinessId,
    string Title,
    string? Description,
    string BusinessName,
    string? CoverImageUrl,
    string? LogoUrl,
    string PackageType,
    string TargetCategory
);

public sealed class GetPublicAdvertisementsQueryHandler
    : IRequestHandler<GetPublicAdvertisementsQuery, List<PublicAdDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPublicAdvertisementsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PublicAdDto>> Handle(
        GetPublicAdvertisementsQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var activeAds = await _context.Advertisements
            .AsNoTracking()
            .Where(a => a.Status == AdStatus.Active && a.StartDate <= now && a.EndDate >= now)
            .Join(
                _context.Businesses.AsNoTracking(),
                ad => ad.TenantId,
                biz => biz.TenantId,
                (ad, biz) => new PublicAdDto(
                    ad.Id,
                    biz.Id,
                    ad.Title,
                    ad.Description,
                    biz.Name,
                    biz.CoverImageUrl,
                    biz.LogoUrl,
                    ad.PackageType.ToString(),
                    ad.TargetCategory.ToString()))
            .ToListAsync(cancellationToken);

        var rng = Random.Shared;
        return activeAds.OrderBy(_ => rng.Next()).Take(request.Count).ToList();
    }
}
