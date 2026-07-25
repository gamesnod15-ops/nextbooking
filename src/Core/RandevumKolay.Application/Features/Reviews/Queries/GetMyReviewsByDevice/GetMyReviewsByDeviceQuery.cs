using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Reviews.Queries.GetMyReviewsByDevice;

/// <summary>Reviews left by a guest customer's device, across every tenant.</summary>
public record GetMyReviewsByDeviceQuery(string DeviceId) : IRequest<List<MyReviewDto>>;

public record MyReviewDto(
    Guid Id,
    Guid BusinessId,
    string BusinessName,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);

public sealed class GetMyReviewsByDeviceQueryHandler
    : IRequestHandler<GetMyReviewsByDeviceQuery, List<MyReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyReviewsByDeviceQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<MyReviewDto>> Handle(GetMyReviewsByDeviceQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            return [];

        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.DeviceId == request.DeviceId)
            .Include(r => r.Business)
            .Where(r => r.Business != null)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new MyReviewDto(
                r.Id,
                r.BusinessId,
                r.Business!.Name,
                r.Rating,
                r.Comment,
                r.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
