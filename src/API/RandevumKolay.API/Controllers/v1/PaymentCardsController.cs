using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.PaymentCards.Commands.CreatePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.DeletePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.SetDefaultPaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Commands.UpdatePaymentCard;
using RandevumKolay.Application.Features.PaymentCards.Queries.GetPaymentCards;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class PaymentCardsController : ControllerBase
{
    private readonly ISender _sender;
    public PaymentCardsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPaymentCards(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPaymentCardsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePaymentCard([FromBody] CreatePaymentCardCommand command, CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return Ok();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePaymentCard(Guid id, [FromBody] UpdatePaymentCardCommand command, CancellationToken cancellationToken = default)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePaymentCard(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeletePaymentCardCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/default")]
    public async Task<IActionResult> SetDefaultPaymentCard(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetDefaultPaymentCardCommand(id), cancellationToken);
        return NoContent();
    }
}
