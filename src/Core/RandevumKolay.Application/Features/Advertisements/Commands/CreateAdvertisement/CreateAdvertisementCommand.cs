using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Advertisements.Commands.CreateAdvertisement;

public record CreateAdvertisementCommand(
    string Title,
    string? Description,
    string PackageType,
    string TargetCategory,
    string? TargetLocation,
    decimal Budget,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate) : IRequest<Guid>;

public sealed class CreateAdvertisementCommandHandler : IRequestHandler<CreateAdvertisementCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateAdvertisementCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateAdvertisementCommand request, CancellationToken cancellationToken)
    {
        var packageType = Enum.Parse<AdPackageType>(
            ToPascalCase(request.PackageType), ignoreCase: true);

        var targetCategory = Enum.Parse<AdTargetCategory>(
            ToPascalCase(request.TargetCategory), ignoreCase: true);

        var ad = Advertisement.Create(
            _tenantService.TenantId,
            request.Title,
            packageType,
            targetCategory,
            request.Budget,
            request.StartDate,
            request.EndDate,
            request.Description,
            request.TargetLocation);

        _context.Advertisements.Add(ad);
        await _context.SaveChangesAsync(cancellationToken);

        return ad.Id;
    }

    /// <summary>
    /// Converts snake_case or camelCase to PascalCase for enum parsing.
    /// e.g. "basic_boost" → "BasicBoost", "professionalBoost" → "ProfessionalBoost"
    /// </summary>
    private static string ToPascalCase(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return input;
        var parts = input.Split('_', '-');
        return string.Concat(parts.Select(p =>
            p.Length > 0
                ? char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant()
                : string.Empty));
    }
}

public class CreateAdvertisementCommandValidator : AbstractValidator<CreateAdvertisementCommand>
{
    public CreateAdvertisementCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Budget).GreaterThan(0);
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
        RuleFor(x => x.PackageType).NotEmpty();
        RuleFor(x => x.TargetCategory).NotEmpty();
    }
}
