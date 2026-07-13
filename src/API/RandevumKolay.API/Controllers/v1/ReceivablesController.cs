using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Receivables;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class ReceivablesController : ControllerBase
{
    private readonly ISender _sender;
    public ReceivablesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetReceivables(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] ReceivableStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetReceivablesQuery(pageNumber, pageSize, search, status), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReceivable([FromBody] CreateReceivableCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetReceivables), new { id }, id);
    }

    [HttpPost("installments/{installmentId:guid}/pay")]
    public async Task<IActionResult> PayInstallment(Guid installmentId, CancellationToken ct)
    {
        await _sender.Send(new PayInstallmentCommand(installmentId), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteReceivable(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteReceivableCommand(id), ct);
        return NoContent();
    }
}
