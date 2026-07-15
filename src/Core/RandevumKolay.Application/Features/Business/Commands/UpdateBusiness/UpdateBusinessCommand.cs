using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Business.Commands.UpdateBusiness;

public record UpdateBusinessCommand(
    string? Name,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    string? PostalCode,
    string? Country,
    string? TaxNumber,
    string? TaxOffice,
    string? Website,
    string? Description,
    string? LogoUrl,
    double? Latitude,
    double? Longitude,
    List<string>? GalleryImages,
    Dictionary<string, string>? Settings) : IRequest;

public sealed class UpdateBusinessCommandHandler : IRequestHandler<UpdateBusinessCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateBusinessCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateBusinessCommand request, CancellationToken cancellationToken)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Business not found for tenant.");

        var effectiveName = string.IsNullOrWhiteSpace(request.Name) ? business.Name : request.Name;
        var effectiveEmail = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email;

        business.Update(effectiveName, request.Phone, effectiveEmail, request.Address, request.City, request.PostalCode, request.Country, request.TaxNumber, request.TaxOffice, request.Website, request.Description, request.Latitude, request.Longitude);

        if (request.LogoUrl is not null)
            business.SetLogo(request.LogoUrl);

        if (request.GalleryImages is not null)
            business.SetGalleryImages(request.GalleryImages);

        if (request.Settings is not null)
            business.UpsertSettings(request.Settings);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdateBusinessCommandValidator : AbstractValidator<UpdateBusinessCommand>
{
    public UpdateBusinessCommandValidator()
    {
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name is not null);
        // Empty string means "no email" — only validate the format when a real value is sent.
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
