using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Business.Queries.GetPublicBusinesses;

public record GetPublicBusinessesQuery(
    string? Search = null,
    int? CategoryId = null,
    string? City = null,
    int PageNumber = 1,
    int PageSize = 12) : IRequest<PaginatedList<PublicBusinessDto>>;

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
    string? CoverImageUrl);

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

        if (request.CategoryId.HasValue)
            query = query.Where(b => (int)b.Category == request.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(request.City))
            query = query.Where(b => b.City != null && b.City.ToLower() == request.City.ToLower());

        var businesses = await query
            .OrderBy(b => b.Name)
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
            })
            .ToListAsync(cancellationToken);

        var totalCount = businesses.Count;

        var paged = businesses
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new PublicBusinessDto(
                b.Id,
                b.Name,
                b.CategoryId,
                CategoryNames.GetValueOrDefault((BusinessCategory)b.CategoryId, "Diğer"),
                b.City,
                b.Phone,
                b.LogoUrl,
                b.Website,
                b.Description,
                b.IsActive,
                b.CoverImageUrl))
            .ToList();

        return new PaginatedList<PublicBusinessDto>(paged, totalCount, request.PageNumber, request.PageSize);
    }
}
