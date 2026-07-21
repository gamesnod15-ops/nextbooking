using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Feedback;

/// <summary>All product feedback submitted across every tenant, for review in
/// the manager panel.</summary>
public record GetPlatformFeedbackQuery(
    int PageNumber = 1,
    int PageSize = 20,
    FeedbackCategory? Category = null) : IRequest<PaginatedList<PlatformFeedbackDto>>;

public record PlatformFeedbackDto(
    Guid Id,
    FeedbackCategory Category,
    string Message,
    string? ImageUrls,
    Guid TenantId,
    string? TenantName,
    Guid? UserId,
    string? UserName,
    string? UserEmail,
    DateTimeOffset CreatedAt);

public sealed class GetPlatformFeedbackQueryHandler : IRequestHandler<GetPlatformFeedbackQuery, PaginatedList<PlatformFeedbackDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformFeedbackQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<PlatformFeedbackDto>> Handle(GetPlatformFeedbackQuery request, CancellationToken cancellationToken)
    {
        var query =
            from f in _context.Feedbacks.AsNoTracking()
            join t in _context.Tenants.AsNoTracking() on f.TenantId equals t.Id into tenants
            from t in tenants.DefaultIfEmpty()
            join u in _context.Users.AsNoTracking() on f.UserId equals u.Id into users
            from u in users.DefaultIfEmpty()
            select new { f, t, u };

        if (request.Category.HasValue)
            query = query.Where(x => x.f.Category == request.Category.Value);

        var projected = query
            .OrderByDescending(x => x.f.CreatedAt)
            .Select(x => new PlatformFeedbackDto(
                x.f.Id,
                x.f.Category,
                x.f.Message,
                x.f.ImageUrls,
                x.f.TenantId,
                x.t != null ? x.t.Name : null,
                x.f.UserId,
                x.u != null ? x.u.FullName : null,
                x.u != null ? x.u.Email : null,
                x.f.CreatedAt));

        return await PaginatedList<PlatformFeedbackDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
