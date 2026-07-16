using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WalkinQueue;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/walkin-queue")]
[ApiController]
[Authorize]
public class WalkinQueueController : ControllerBase
{
    private readonly ISender _sender;
    public WalkinQueueController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetQueue(CancellationToken ct)
        => Ok(await _sender.Send(new GetQueueQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> AddEntry([FromBody] AddQueueEntryCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetQueue), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest body, CancellationToken ct)
    {
        await _sender.Send(new UpdateQueueStatusCommand(id, body.Status), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteQueueEntryCommand(id), ct);
        return NoContent();
    }

    public record UpdateStatusRequest(string Status);
}
