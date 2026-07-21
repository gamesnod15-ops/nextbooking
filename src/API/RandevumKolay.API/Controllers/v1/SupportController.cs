using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Support.Commands.SubmitSupportRequest;
using RandevumKolay.Application.Features.Support.Queries.GetSupportContact;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/support")]
[ApiController]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly ISender _sender;

    public SupportController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("contact")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContact(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetSupportContactQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("contact")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SubmitContact([FromBody] SubmitSupportRequestCommand command, CancellationToken cancellationToken)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }
}
