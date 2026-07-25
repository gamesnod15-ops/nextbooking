using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Favorites;

/// <summary>Favorite businesses saved by a customer app user.</summary>
public record FavoriteBusinessDto(
    Guid Id,
    Guid BusinessId,
    string Name,
    int CategoryId,
    string CategoryName,
    string? City,
    string? Phone,
    string? LogoUrl,
    string? CoverImageUrl,
    string? Description,
    bool IsActive,
    DateTimeOffset FavoritedAt);

internal static class FavoriteCategoryNames
{
    public static readonly Dictionary<BusinessCategory, string> Map = new()
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
}

// ── Query: list my favorites ─────────────────────────────────────────────────

public record GetMyFavoritesQuery : IRequest<List<FavoriteBusinessDto>>;

public sealed class GetMyFavoritesQueryHandler : IRequestHandler<GetMyFavoritesQuery, List<FavoriteBusinessDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMyFavoritesQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<FavoriteBusinessDto>> Handle(GetMyFavoritesQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var favorites = await _context.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Include(f => f.Business)
            .Where(f => f.Business != null)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                FavoriteId = f.Id,
                f.CreatedAt,
                BusinessId = f.Business!.Id,
                f.Business.Name,
                Category = (int)f.Business.Category,
                f.Business.City,
                f.Business.Phone,
                f.Business.LogoUrl,
                f.Business.CoverImageUrl,
                f.Business.Description,
                f.Business.IsActive,
            })
            .ToListAsync(cancellationToken);

        return favorites
            .Select(f => new FavoriteBusinessDto(
                f.FavoriteId,
                f.BusinessId,
                f.Name,
                f.Category,
                FavoriteCategoryNames.Map.GetValueOrDefault((BusinessCategory)f.Category, "Diğer"),
                f.City,
                f.Phone,
                f.LogoUrl,
                f.CoverImageUrl,
                f.Description,
                f.IsActive,
                f.CreatedAt))
            .ToList();
    }
}

// ── Command: add favorite ────────────────────────────────────────────────────

public record AddFavoriteCommand(Guid BusinessId) : IRequest<Guid>;

public sealed class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AddFavoriteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(AddFavoriteCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var businessExists = await _context.Businesses
            .AnyAsync(b => b.Id == request.BusinessId && !b.IsDeleted, cancellationToken);
        if (!businessExists)
            throw new NotFoundException(nameof(Domain.Entities.Business), request.BusinessId);

        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.BusinessId == request.BusinessId, cancellationToken);
        if (existing is not null)
            return existing.Id;

        var favorite = Favorite.CreateForUser(userId, request.BusinessId);
        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync(cancellationToken);

        return favorite.Id;
    }
}

// ── Command: remove favorite ─────────────────────────────────────────────────

public record RemoveFavoriteCommand(Guid BusinessId) : IRequest;

public sealed class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public RemoveFavoriteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(RemoveFavoriteCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.BusinessId == request.BusinessId, cancellationToken);

        if (favorite is not null)
        {
            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

// ── Device-based variants (guest customers with no account) ─────────────────

public record GetFavoritesByDeviceQuery(string DeviceId) : IRequest<List<FavoriteBusinessDto>>;

public sealed class GetFavoritesByDeviceQueryHandler : IRequestHandler<GetFavoritesByDeviceQuery, List<FavoriteBusinessDto>>
{
    private readonly IApplicationDbContext _context;

    public GetFavoritesByDeviceQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<FavoriteBusinessDto>> Handle(GetFavoritesByDeviceQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            return [];

        var favorites = await _context.Favorites
            .AsNoTracking()
            .Where(f => f.DeviceId == request.DeviceId)
            .Include(f => f.Business)
            .Where(f => f.Business != null)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                FavoriteId = f.Id,
                f.CreatedAt,
                BusinessId = f.Business!.Id,
                f.Business.Name,
                Category = (int)f.Business.Category,
                f.Business.City,
                f.Business.Phone,
                f.Business.LogoUrl,
                f.Business.CoverImageUrl,
                f.Business.Description,
                f.Business.IsActive,
            })
            .ToListAsync(cancellationToken);

        return favorites
            .Select(f => new FavoriteBusinessDto(
                f.FavoriteId,
                f.BusinessId,
                f.Name,
                f.Category,
                FavoriteCategoryNames.Map.GetValueOrDefault((BusinessCategory)f.Category, "Diğer"),
                f.City,
                f.Phone,
                f.LogoUrl,
                f.CoverImageUrl,
                f.Description,
                f.IsActive,
                f.CreatedAt))
            .ToList();
    }
}

public record AddFavoriteByDeviceCommand(string DeviceId, Guid BusinessId) : IRequest<Guid>;

public sealed class AddFavoriteByDeviceCommandHandler : IRequestHandler<AddFavoriteByDeviceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddFavoriteByDeviceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(AddFavoriteByDeviceCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            throw new ValidationException("Device id is required.");

        var businessExists = await _context.Businesses
            .AnyAsync(b => b.Id == request.BusinessId && !b.IsDeleted, cancellationToken);
        if (!businessExists)
            throw new NotFoundException(nameof(Domain.Entities.Business), request.BusinessId);

        var existing = await _context.Favorites
            .FirstOrDefaultAsync(f => f.DeviceId == request.DeviceId && f.BusinessId == request.BusinessId, cancellationToken);
        if (existing is not null)
            return existing.Id;

        var favorite = Favorite.CreateForDevice(request.DeviceId, request.BusinessId);
        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync(cancellationToken);

        return favorite.Id;
    }
}

public record RemoveFavoriteByDeviceCommand(string DeviceId, Guid BusinessId) : IRequest;

public sealed class RemoveFavoriteByDeviceCommandHandler : IRequestHandler<RemoveFavoriteByDeviceCommand>
{
    private readonly IApplicationDbContext _context;

    public RemoveFavoriteByDeviceCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(RemoveFavoriteByDeviceCommand request, CancellationToken cancellationToken)
    {
        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.DeviceId == request.DeviceId && f.BusinessId == request.BusinessId, cancellationToken);

        if (favorite is not null)
        {
            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
