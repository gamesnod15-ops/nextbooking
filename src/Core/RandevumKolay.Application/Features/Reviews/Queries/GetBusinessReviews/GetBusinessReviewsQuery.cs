using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Reviews.Queries.GetBusinessReviews;

public record GetBusinessReviewsQuery(Guid BusinessId) : IRequest<List<ReviewListItemDto>>;

public record ReviewListItemDto(Guid Id, string AuthorName, int Rating, string? Comment, DateTimeOffset CreatedAt);

public sealed class GetBusinessReviewsQueryHandler
    : IRequestHandler<GetBusinessReviewsQuery, List<ReviewListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetBusinessReviewsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<ReviewListItemDto>> Handle(GetBusinessReviewsQuery request, CancellationToken cancellationToken)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.BusinessId == request.BusinessId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewListItemDto(r.Id, r.AuthorName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
