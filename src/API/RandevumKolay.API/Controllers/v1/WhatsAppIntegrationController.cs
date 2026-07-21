using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WhatsAppIntegrations.Commands.ConnectWhatsAppIntegration;
using RandevumKolay.Application.Features.WhatsAppIntegrations.Commands.DisconnectWhatsAppIntegration;
using RandevumKolay.Application.Features.WhatsAppIntegrations.Queries.GetWhatsAppIntegrationStatus;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/whatsapp-integration")]
[ApiController]
[Authorize]
public class WhatsAppIntegrationController : ControllerBase
{
    private readonly ISender _sender;

    public WhatsAppIntegrationController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetWhatsAppIntegrationStatusQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("connect")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Connect(
        [FromBody] ConnectWhatsAppIntegrationCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("disconnect")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Disconnect(CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DisconnectWhatsAppIntegrationCommand(), cancellationToken);
        return NoContent();
    }
}
