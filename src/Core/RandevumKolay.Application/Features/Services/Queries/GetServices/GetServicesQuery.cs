using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;

namespace RandevumKolay.Application.Features.Services.Queries.GetServices;

public record GetServicesQuery(
    int PageNumber = 1,
    int PageSize = 50,
    string? SearchTerm = null,
    bool? IsActive = null) : IRequest<PaginatedList<ServiceDto>>;

public record ServiceDto(
    Guid Id,
    string Name,
    string? Description,
    int DurationMinutes,
    int BufferMinutes,
    decimal Price,
    string? Color,
    string? ImageUrl,
    bool IsActive,
    bool RequiresConfirmation,
    int? MaxCapacity,
    int SortOrder,
    DateTimeOffset CreatedAt);

public sealed class GetServicesQueryHandler : IRequestHandler<GetServicesQuery, PaginatedList<ServiceDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetServicesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<ServiceDto>> Handle(GetServicesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Services
            .AsNoTracking()
            .Where(s => s.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(term));
        }

        if (request.IsActive.HasValue)
            query = query.Where(s => s.IsActive == request.IsActive.Value);

        var projected = query
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .Select(s => new ServiceDto(
                s.Id,
                s.Name,
                s.Description,
                s.DurationMinutes,
                s.BufferMinutes,
                s.Price,
                s.Color,
                s.ImageUrl,
                s.IsActive,
                s.RequiresConfirmation,
                s.MaxCapacity,
                s.SortOrder,
                s.CreatedAt));

        return await PaginatedList<ServiceDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
