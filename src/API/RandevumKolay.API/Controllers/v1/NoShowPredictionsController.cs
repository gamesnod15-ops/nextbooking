using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.NoShowPrediction.Commands.UpdateActualOutcome;
using RandevumKolay.Application.Features.NoShowPrediction.Queries.GetNoShowPredictions;
using RandevumKolay.Application.Features.NoShowPrediction.Queries.PredictNoShow;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class NoShowPredictionsController : ControllerBase
{
    private readonly ISender _sender;

    public NoShowPredictionsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("predict")]
    public async Task<IActionResult> PredictNoShow(
        [FromBody] PredictNoShowQuery query,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetPredictions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? riskLevel = null,
        [FromQuery] bool? requiresDeposit = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetNoShowPredictionsQuery(pageNumber, pageSize, riskLevel, requiresDeposit),
            cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/outcome")]
    public async Task<IActionResult> UpdateOutcome(
        Guid id,
        [FromBody] UpdateOutcomeRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateActualOutcomeCommand(id, request.NoShow), cancellationToken);
        return NoContent();
    }
}

public record UpdateOutcomeRequest(bool NoShow);
