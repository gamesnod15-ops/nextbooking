using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Branches;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly ISender _sender;
    public BranchesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetBranches(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetBranchesQuery(pageNumber, pageSize), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetBranches), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBranch(Guid id, [FromBody] UpdateBranchCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBranch(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteBranchCommand(id), ct);
        return NoContent();
    }
}
