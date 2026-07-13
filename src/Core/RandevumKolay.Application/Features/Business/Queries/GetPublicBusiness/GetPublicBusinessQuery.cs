using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Business.Queries.GetPublicBusiness;

public record GetPublicBusinessQuery(Guid Id) : IRequest<PublicBusinessDetailDto?>;

public record PublicBusinessDetailDto(
    Guid Id,
    string Name,
    int CategoryId,
    string CategoryName,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    string? Website,
    string? LogoUrl,
    string? CoverImageUrl,
    string? Description,
    double? Latitude,
    double? Longitude,
    string? WorkingHours,
    List<string> GalleryImages,
    List<PublicServiceDto> Services,
    List<PublicEmployeeDto> Employees);

public record PublicServiceDto(Guid Id, string Name, string? Description, int DurationMinutes, decimal Price, string? ImageUrl);

public record PublicEmployeeDto(Guid Id, string Name, string? Title, string? AvatarUrl);

public sealed class GetPublicBusinessQueryHandler
    : IRequestHandler<GetPublicBusinessQuery, PublicBusinessDetailDto?>
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

    public GetPublicBusinessQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PublicBusinessDetailDto?> Handle(
        GetPublicBusinessQuery request,
        CancellationToken cancellationToken)
    {
        var business = await _context.Businesses
            .AsNoTracking()
            .Include(b => b.Services)
            .Include(b => b.Employees)
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.IsActive, cancellationToken);

        if (business is null) return null;

        string? workingHoursJson = null;
        if (business.Settings is not null)
            business.Settings.TryGetValue("workingHours", out workingHoursJson);

        return new PublicBusinessDetailDto(
            business.Id,
            business.Name,
            (int)business.Category,
            CategoryNames.GetValueOrDefault(business.Category, "Diğer"),
            business.Phone,
            business.Email,
            business.Address,
            business.City,
            business.Website,
            business.LogoUrl,
            business.CoverImageUrl,
            business.Description,
            business.Latitude,
            business.Longitude,
            workingHoursJson,
            business.GalleryImages ?? new(),
            business.Services.Select(s => new PublicServiceDto(
                s.Id, s.Name, s.Description, s.DurationMinutes, s.Price, s.ImageUrl)).ToList(),
            business.Employees.Select(e => new PublicEmployeeDto(
                e.Id, e.Name, e.Title, e.AvatarUrl)).ToList());
    }
}
