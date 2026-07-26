using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.PushTokens;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/push-tokens")]
[ApiController]
public class PushTokensController : ControllerBase
{
    private readonly ISender _sender;

    public PushTokensController(ISender sender) => _sender = sender;

    /// <summary>
    /// Anonymous by design — guest customers have no account but still need
    /// appointment reminders.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterPushTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(
            new RegisterPushTokenCommand(request.DeviceId, request.Token, request.Platform, request.UserId),
            cancellationToken);
        return Ok(new { id });
    }

    public record RegisterPushTokenRequest(
        string DeviceId,
        string Token,
        string Platform,
        Guid? UserId);
}
