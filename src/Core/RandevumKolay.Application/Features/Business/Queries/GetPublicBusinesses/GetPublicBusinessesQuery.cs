using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Business.Queries.GetPublicBusinesses;

public record GetPublicBusinessesQuery(
    string? Search = null,
    List<int>? CategoryIds = null,
    List<string>? Cities = null,
    int PageNumber = 1,
    int PageSize = 12,
    double? Latitude = null,
    double? Longitude = null) : IRequest<PaginatedList<PublicBusinessDto>>;

public record PublicBusinessDto(
    Guid Id,
    string Name,
    int CategoryId,
    string CategoryName,
    string? City,
    string? Phone,
    string? LogoUrl,
    string? Website,
    string? Description,
    bool IsActive,
    string? CoverImageUrl,
    double AverageRating,
    int ReviewCount,
    double? Latitude,
    double? Longitude,
    /// <summary>Great-circle distance from the caller's coordinates, null when none were supplied.</summary>
    double? DistanceKm);

public sealed class GetPublicBusinessesQueryHandler
    : IRequestHandler<GetPublicBusinessesQuery, PaginatedList<PublicBusinessDto>>
{
    private static readonly Dictionary<BusinessCategory, string> CategoryNames = new()
    {
        [BusinessCategory.BeautySalon] = "Güzellik Salonu",
        [BusinessCategory.Barbershop] = "Kuaför & Berber",
        [BusinessCategory.Clinic] = "Klinik",
        [BusinessCategory.Dentist] = "Diş Hekimi",
        [BusinessCategory.Physiotherapy] = "Fizyoterapi",
        [BusinessCategory.Gym] = "Spor Salonu",
        [BusinessCategory.PersonalTrainer] = "Kişisel Antrenör",
        [BusinessCategory.Yoga] = "Yoga",
        [BusinessCategory.Spa] = "Spa & Masaj",
        [BusinessCategory.NailSalon] = "Tırnak Salonu",
        [BusinessCategory.Tattoo] = "Dövme",
        [BusinessCategory.Veterinarian] = "Veteriner",
        [BusinessCategory.CarService] = "Oto Servis",
        [BusinessCategory.CarWash] = "Oto Yıkama",
        [BusinessCategory.RepairService] = "Tamir & Bakım",
        [BusinessCategory.Consultant] = "Danışmanlık",
        [BusinessCategory.Psychologist] = "Psikolog",
        [BusinessCategory.Nutritionist] = "Diyetisyen",
        [BusinessCategory.Tutor] = "Özel Ders",
        [BusinessCategory.Photographer] = "Fotoğrafçı",
        [BusinessCategory.Other] = "Diğer",
    };

    private readonly IApplicationDbContext _context;

    public GetPublicBusinessesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedList<PublicBusinessDto>> Handle(
        GetPublicBusinessesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Businesses
            .AsNoTracking()
            .Where(b => b.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.ToLower();
            query = query.Where(b =>
                b.Name.ToLower().Contains(term) ||
                (b.City != null && b.City.ToLower().Contains(term)) ||
                (b.Description != null && b.Description.ToLower().Contains(term)));
        }

        if (request.CategoryIds != null && request.CategoryIds.Count > 0)
            query = query.Where(b => request.CategoryIds.Contains((int)b.Category));

        if (request.Cities != null && request.Cities.Count > 0)
        {
            var lowerCities = request.Cities.Select(c => c.ToLower()).ToList();
            query = query.Where(b => b.City != null && lowerCities.Contains(b.City.ToLower()));
        }

        var rows = await query
            .Select(b => new
            {
                b.Id,
                b.Name,
                CategoryId = (int)b.Category,
                b.City,
                b.Phone,
                b.LogoUrl,
                b.Website,
                b.Description,
                b.IsActive,
                b.CoverImageUrl,
                GalleryImages = b.GalleryImages.Take(1).ToList(),
                b.Latitude,
                b.Longitude,
            })
            .ToListAsync(cancellationToken);

        // When the caller supplies coordinates, order by real distance (nearest first)
        // and push businesses without coordinates to the end.
        var businesses = (request.Latitude.HasValue && request.Longitude.HasValue)
            ? rows
                .Select(b => new
                {
                    Row = b,
                    Distance = DistanceKm(request.Latitude.Value, request.Longitude.Value, b.Latitude, b.Longitude),
                })
                .OrderBy(x => x.Distance ?? double.MaxValue)
                .ThenBy(x => x.Row.Name)
                .Select(x => new { x.Row, x.Distance })
                .ToList()
            : rows
                .OrderBy(b => b.Name)
                .Select(b => new { Row = b, Distance = (double?)null })
                .ToList();

        var totalCount = businesses.Count;

        var page = businesses
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var pageIds = page.Select(x => x.Row.Id).ToList();

        var ratings = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.IsApproved && pageIds.Contains(r.BusinessId))
            .GroupBy(r => r.BusinessId)
            .Select(g => new { BusinessId = g.Key, Average = g.Average(r => r.Rating), Count = g.Count() })
            .ToDictionaryAsync(g => g.BusinessId, g => (g.Average, g.Count), cancellationToken);

        var paged = page
            .Select(x => new PublicBusinessDto(
                x.Row.Id,
                x.Row.Name,
                x.Row.CategoryId,
                CategoryNames.GetValueOrDefault((BusinessCategory)x.Row.CategoryId, "Diğer"),
                x.Row.City,
                x.Row.Phone,
                x.Row.LogoUrl,
                x.Row.Website,
                x.Row.Description,
                x.Row.IsActive,
                string.IsNullOrEmpty(x.Row.CoverImageUrl)
                    ? x.Row.GalleryImages.FirstOrDefault()
                    : x.Row.CoverImageUrl,
                ratings.TryGetValue(x.Row.Id, out var r) ? Math.Round(r.Average, 1) : 0,
                ratings.TryGetValue(x.Row.Id, out var r2) ? r2.Count : 0,
                x.Row.Latitude,
                x.Row.Longitude,
                x.Distance.HasValue ? Math.Round(x.Distance.Value, 1) : null))
            .ToList();

        return new PaginatedList<PublicBusinessDto>(paged, totalCount, request.PageNumber, request.PageSize);
    }

    /// <summary>Haversine great-circle distance in kilometres; null when the business has no coordinates.</summary>
    private static double? DistanceKm(double fromLat, double fromLng, double? toLat, double? toLng)
    {
        if (!toLat.HasValue || !toLng.HasValue) return null;

        const double earthRadiusKm = 6371.0;
        var dLat = ToRadians(toLat.Value - fromLat);
        var dLng = ToRadians(toLng.Value - fromLng);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRadians(fromLat)) * Math.Cos(ToRadians(toLat.Value))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
