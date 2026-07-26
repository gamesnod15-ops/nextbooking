using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.ClientErrors;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/client-errors")]
[ApiController]
public class ClientErrorsController : ControllerBase
{
    private readonly ISender _sender;

    public ClientErrorsController(ISender sender) => _sender = sender;

    /// <summary>
    /// Receives a crash report from a mobile client. Anonymous because the app
    /// may crash before (or without) a user ever signing in.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Log(
        [FromBody] LogClientErrorRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(
            new LogClientErrorCommand(
                request.Message,
                request.Stack,
                request.ComponentStack,
                request.Scope,
                request.Platform ?? "unknown",
                request.OsVersion,
                request.AppVersion,
                request.AppEnv,
                request.DeviceId),
            cancellationToken);

        return NoContent();
    }

    public record LogClientErrorRequest(
        string Message,
        string? Stack,
        string? ComponentStack,
        string? Scope,
        string? Platform,
        string? OsVersion,
        string? AppVersion,
        string? AppEnv,
        string? DeviceId);
}
