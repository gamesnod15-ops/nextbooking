using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.NoShowPrediction.Commands.UpdateActualOutcome;

public record UpdateActualOutcomeCommand(Guid PredictionId, bool NoShow) : IRequest;

public sealed class UpdateActualOutcomeCommandHandler
    : IRequestHandler<UpdateActualOutcomeCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateActualOutcomeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateActualOutcomeCommand request, CancellationToken cancellationToken)
    {
        var prediction = await _context.NoShowPredictions
            .FirstOrDefaultAsync(p => p.Id == request.PredictionId, cancellationToken);

        if (prediction is null) return;

        prediction.MarkActualNoShow(request.NoShow);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
