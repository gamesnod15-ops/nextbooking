using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Packages;

public record GetPackagesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    bool? IsActive = null,
    string? SearchTerm = null) : IRequest<PaginatedList<PackageDto>>;

public record PackageDto(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    decimal? OriginalPrice,
    int ValidityDays,
    bool IsActive,
    string? ImageUrl,
    List<PackageItemDto> Items,
    DateTimeOffset CreatedAt);

public record PackageItemDto(Guid ServiceId, string ServiceName, int Quantity);

public sealed class GetPackagesQueryHandler : IRequestHandler<GetPackagesQuery, PaginatedList<PackageDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetPackagesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<PackageDto>> Handle(GetPackagesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Packages
            .AsNoTracking()
            .Where(p => p.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.IsActive.HasValue)
            query = query.Where(p => p.IsActive == request.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var packages = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = new List<PackageDto>(packages.Count);

        foreach (var package in packages)
        {
            items.Add(new PackageDto(
                package.Id,
                package.Name,
                package.Description,
                package.Price,
                package.OriginalPrice,
                package.ValidityDays,
                package.IsActive,
                package.ImageUrl,
                package.Items.Select(item => new PackageItemDto(item.ServiceId, item.ServiceName, item.Quantity)).ToList(),
                package.CreatedAt));
        }

        return new PaginatedList<PackageDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}

public record CreatePackageCommand(
    string Name,
    string? Description,
    decimal Price,
    decimal? OriginalPrice,
    int ValidityDays,
    string? ImageUrl,
    List<PackageItemInput>? Items) : IRequest<Guid>;

public record PackageItemInput(Guid ServiceId, string ServiceName, int Quantity);

public sealed class CreatePackageCommandHandler : IRequestHandler<CreatePackageCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreatePackageCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreatePackageCommand request, CancellationToken cancellationToken)
    {
        var package = Package.Create(_tenantService.TenantId, request.Name, request.Price,
            request.ValidityDays, request.Description, request.OriginalPrice);

        if (request.ImageUrl is not null)
            package.SetImage(request.ImageUrl);

        if (request.Items?.Count > 0)
            package.SetItems(request.Items.Select(i => new PackageItem
            {
                ServiceId = i.ServiceId,
                ServiceName = i.ServiceName,
                Quantity = i.Quantity
            }).ToList());

        _context.Packages.Add(package);
        await _context.SaveChangesAsync(cancellationToken);

        return package.Id;
    }
}

public class CreatePackageCommandValidator : AbstractValidator<CreatePackageCommand>
{
    public CreatePackageCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ValidityDays).GreaterThan(0);
    }
}

public record UpdatePackageCommand(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    decimal? OriginalPrice,
    int ValidityDays,
    bool IsActive,
    string? ImageUrl,
    List<PackageItemInput>? Items) : IRequest;

public sealed class UpdatePackageCommandHandler : IRequestHandler<UpdatePackageCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdatePackageCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdatePackageCommand request, CancellationToken cancellationToken)
    {
        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Package {request.Id} not found.");

        package.Update(request.Name, request.Description, request.Price,
            request.OriginalPrice, request.ValidityDays, request.IsActive);

        if (request.ImageUrl is not null)
            package.SetImage(request.ImageUrl);

        if (request.Items is not null)
            package.SetItems(request.Items.Select(i => new PackageItem
            {
                ServiceId = i.ServiceId,
                ServiceName = i.ServiceName,
                Quantity = i.Quantity
            }).ToList());

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public record DeletePackageCommand(Guid Id) : IRequest;

public sealed class DeletePackageCommandHandler : IRequestHandler<DeletePackageCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeletePackageCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeletePackageCommand request, CancellationToken cancellationToken)
    {
        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Package {request.Id} not found.");

        _context.Packages.Remove(package);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
