using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Business.Queries.GetBusiness;

public record GetBusinessQuery : IRequest<BusinessDto>;

public record BusinessDto(
    Guid Id,
    string Name,
    BusinessCategory Category,
    string Timezone,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    string? PostalCode,
    string? Country,
    string? TaxNumber,
    string? TaxOffice,
    string? Website,
    string? LogoUrl,
    string? CoverImageUrl,
    string? Description,
    double? Latitude,
    double? Longitude,
    List<string> GalleryImages,
    string Plan,
    DateTimeOffset? SubscriptionEndsAt,
    Dictionary<string, string> Settings);

public sealed class GetBusinessQueryHandler : IRequestHandler<GetBusinessQuery, BusinessDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetBusinessQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<BusinessDto> Handle(GetBusinessQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;

        var business = await _context.Businesses
            .AsNoTracking()
            .Where(b => b.TenantId == tenantId)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Category,
                b.Timezone,
                b.Phone,
                b.Email,
                b.Address,
                b.City,
                b.PostalCode,
                b.Country,
                b.TaxNumber,
                b.TaxOffice,
                b.Website,
                b.LogoUrl,
                b.CoverImageUrl,
                b.Description,
                b.Latitude,
                b.Longitude,
                b.GalleryImages,
                b.Settings,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Business not found for tenant.");

        var tenant = await _context.Tenants
            .AsNoTracking()
            .Where(t => t.Id == tenantId)
            .Select(t => new { t.Plan, t.SubscriptionEndsAt })
            .FirstOrDefaultAsync(cancellationToken);

        return new BusinessDto(
            business.Id,
            business.Name,
            business.Category,
            business.Timezone,
            business.Phone,
            business.Email,
            business.Address,
            business.City,
            business.PostalCode,
            business.Country,
            business.TaxNumber,
            business.TaxOffice,
            business.Website,
            business.LogoUrl,
            business.CoverImageUrl,
            business.Description,
            business.Latitude,
            business.Longitude,
            business.GalleryImages,
            tenant?.Plan ?? "starter",
            tenant?.SubscriptionEndsAt,
            business.Settings);
    }
}
