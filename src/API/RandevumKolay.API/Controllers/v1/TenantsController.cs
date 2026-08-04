using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Tenants.Commands.CreateBusinessForCurrentUser;
using RandevumKolay.Application.Features.Tenants.Commands.RegisterTenant;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class TenantsController : ControllerBase
{
    private readonly ISender _sender;

    public TenantsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterTenantCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(Register), result);
    }

    /// <summary>
    /// Attaches a business to the calling account instead of registering a
    /// new one — for a user who already has an account (e.g. via Google/Apple
    /// signup) and only now decides to create a business.
    /// </summary>
    [HttpPost("create-for-current-user")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateForCurrentUser(
        [FromBody] CreateBusinessForCurrentUserCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(CreateForCurrentUser), result);
    }
}
