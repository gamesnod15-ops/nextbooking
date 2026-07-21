using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.PaymentCards.Commands.CreatePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.DeletePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.SetDefaultPaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.UpdatePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Queries.GetPaymentCards;
using RandevumKolay.Application.Features.Payments.Commands.RecordPayment;
using RandevumKolay.Application.Features.Payments.Queries.GetPayments;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly ISender _sender;

    public PaymentsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] PaymentStatus? status = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetPaymentsQuery(pageNumber, pageSize, status, startDate, endDate, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> RecordPayment(
        [FromBody] RecordPaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetPayments), new { id }, new { id });
    }

    [HttpGet("cards")]
    public async Task<IActionResult> GetCards(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPaymentCardsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("cards")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CreateCard(
        [FromBody] CreatePaymentCardCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("cards/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateCard(
        Guid id,
        [FromBody] UpdatePaymentCardCommand command,
        CancellationToken cancellationToken = default)
    {
        if (id != command.Id)
            return BadRequest("Id mismatch.");
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("cards/{id:guid}/default")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetDefaultCard(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetDefaultPaymentCardCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpDelete("cards/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCard(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeletePaymentCardCommand(id), cancellationToken);
        return NoContent();
    }
}
