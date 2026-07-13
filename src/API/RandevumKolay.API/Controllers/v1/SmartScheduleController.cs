using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.ScheduleOptimization.Queries.GetOptimizationSuggestions;
using RandevumKolay.Application.Features.ScheduleOptimization.Queries.GetOverbookingSuggestions;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/smart-schedule")]
[ApiController]
[Authorize]
public class SmartScheduleController : ControllerBase
{
    private readonly ISender _sender;

    public SmartScheduleController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("optimizations")]
    public async Task<IActionResult> GetOptimizations(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetOptimizationSuggestionsQuery(startDate, endDate), cancellationToken);
        return Ok(result);
    }

    [HttpGet("overbooking")]
    public async Task<IActionResult> GetOverbookingSuggestions(
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetOverbookingSuggestionsQuery(date), cancellationToken);
        return Ok(result);
    }
}
