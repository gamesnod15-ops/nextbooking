using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Commissions;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class CommissionsController : ControllerBase
{
    private readonly ISender _sender;
    public CommissionsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetCommissions(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? period = null, [FromQuery] CommissionStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetCommissionsQuery(pageNumber, pageSize, period, status), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCommission([FromBody] CreateCommissionCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetCommissions), new { id }, id);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveCommission(Guid id, CancellationToken ct)
    {
        await _sender.Send(new ApproveCommissionCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> PayCommission(Guid id, CancellationToken ct)
    {
        await _sender.Send(new PayCommissionCommand(id), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCommission(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteCommissionCommand(id), ct);
        return NoContent();
    }
}
