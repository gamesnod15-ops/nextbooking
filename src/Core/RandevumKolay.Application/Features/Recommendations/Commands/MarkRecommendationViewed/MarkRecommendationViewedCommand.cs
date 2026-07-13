using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Recommendations.Commands.MarkRecommendationViewed;

public record MarkRecommendationViewedCommand(Guid Id) : IRequest;

public sealed class MarkRecommendationViewedCommandHandler
    : IRequestHandler<MarkRecommendationViewedCommand>
{
    private readonly IApplicationDbContext _context;

    public MarkRecommendationViewedCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(MarkRecommendationViewedCommand request, CancellationToken cancellationToken)
    {
        var recommendation = await _context.CustomerRecommendations
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (recommendation is not null)
        {
            recommendation.MarkAsViewed();
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
