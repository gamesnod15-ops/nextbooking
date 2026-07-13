using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Advertisements.Commands.CreateAdvertisement;
using RandevumKolay.Application.Features.Advertisements.Commands.DeleteAdvertisement;
using RandevumKolay.Application.Features.Advertisements.Commands.UpdateAdvertisementStatus;
using RandevumKolay.Application.Features.Advertisements.Queries.GetAdvertisementAnalytics;
using RandevumKolay.Application.Features.Advertisements.Queries.GetAdvertisements;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class AdvertisementsController : ControllerBase
{
    private readonly ISender _sender;

    public AdvertisementsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetAdvertisements(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] AdStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetAdvertisementsQuery(pageNumber, pageSize, status),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAdvertisementAnalyticsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAdvertisement(
        [FromBody] CreateAdvertisementCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAdvertisements), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateAdvertisementStatusCommand(id, request.Status), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteAdvertisement(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteAdvertisementCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateStatusRequest(AdStatus Status);
}
