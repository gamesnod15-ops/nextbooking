using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Deposits.Commands.ApplyDeposit;
using RandevumKolay.Application.Features.Deposits.Commands.CancelDeposit;
using RandevumKolay.Application.Features.Deposits.Commands.CreateDeposit;
using RandevumKolay.Application.Features.Deposits.Commands.ForfeitDeposit;
using RandevumKolay.Application.Features.Deposits.Commands.RefundDeposit;
using RandevumKolay.Application.Features.Deposits.Queries.GetDeposits;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class DepositsController : ControllerBase
{
    private readonly ISender _sender;

    public DepositsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetDeposits(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DepositStatus? status = null,
        [FromQuery] Guid? appointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetDepositsQuery(pageNumber, pageSize, status, appointmentId),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDeposit(
        [FromBody] CreateDepositCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetDeposits), new { id }, new { id });
    }

    [HttpPost("{id:guid}/apply")]
    public async Task<IActionResult> ApplyDeposit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ApplyDepositCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/refund")]
    public async Task<IActionResult> RefundDeposit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new RefundDepositCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelDeposit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new CancelDepositCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/forfeit")]
    public async Task<IActionResult> ForfeitDeposit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ForfeitDepositCommand(id), cancellationToken);
        return NoContent();
    }
}
