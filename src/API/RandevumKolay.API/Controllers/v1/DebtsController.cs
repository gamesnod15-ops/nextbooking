using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Debts;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly ISender _sender;
    public DebtsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetDebts(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] DebtStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetDebtsQuery(pageNumber, pageSize, search, status), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDebt([FromBody] CreateDebtCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetDebts), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateDebt(Guid id, [FromBody] UpdateDebtCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> PayDebt(Guid id, [FromBody] PayDebtRequest request, CancellationToken ct)
    {
        await _sender.Send(new PayDebtCommand(id, request.Amount), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDebt(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteDebtCommand(id), ct);
        return NoContent();
    }
}

public record PayDebtRequest(decimal Amount);
