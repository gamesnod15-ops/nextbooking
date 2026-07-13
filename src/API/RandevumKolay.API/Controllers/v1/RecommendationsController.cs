using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Recommendations.Commands.GenerateRecommendations;
using RandevumKolay.Application.Features.Recommendations.Commands.MarkRecommendationViewed;
using RandevumKolay.Application.Features.Recommendations.Queries.GetAllRecommendations;
using RandevumKolay.Application.Features.Recommendations.Queries.GetProductRecommendations;
using RandevumKolay.Application.Features.Recommendations.Queries.GetServiceRecommendations;
using RandevumKolay.Application.Features.Recommendations.Queries.GetTimelyRecommendations;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly ISender _sender;

    public RecommendationsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("services/{customerId:guid}")]
    public async Task<IActionResult> GetServiceRecommendations(
        Guid customerId,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetServiceRecommendationsQuery(customerId, count), cancellationToken);
        return Ok(result);
    }

    [HttpGet("products/{customerId:guid}")]
    public async Task<IActionResult> GetProductRecommendations(
        Guid customerId,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetProductRecommendationsQuery(customerId, count), cancellationToken);
        return Ok(result);
    }

    [HttpGet("timely/{customerId:guid}")]
    public async Task<IActionResult> GetTimelyRecommendations(
        Guid customerId,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetTimelyRecommendationsQuery(customerId, count), cancellationToken);
        return Ok(result);
    }

    [HttpGet("all/{customerId:guid}")]
    public async Task<IActionResult> GetAllRecommendations(
        Guid customerId,
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetAllRecommendationsQuery(customerId, count), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/viewed")]
    public async Task<IActionResult> MarkViewed(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new MarkRecommendationViewedCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("generate/{customerId:guid}")]
    public async Task<IActionResult> GenerateRecommendations(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new GenerateRecommendationsCommand(customerId), cancellationToken);
        return NoContent();
    }
}
