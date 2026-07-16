using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WaitingList;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/waiting-list")]
[ApiController]
[Authorize]
public class WaitingListController : ControllerBase
{
    private readonly ISender _sender;
    public WaitingListController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetWaitingList(CancellationToken ct)
        => Ok(await _sender.Send(new GetWaitingListQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> AddEntry([FromBody] AddWaitingListEntryCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetWaitingList), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest body, CancellationToken ct)
    {
        await _sender.Send(new UpdateWaitingListStatusCommand(id, body.Status), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteWaitingListEntryCommand(id), ct);
        return NoContent();
    }

    public record UpdateStatusRequest(string Status);
}
