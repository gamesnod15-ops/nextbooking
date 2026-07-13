using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Business.Commands.CancelSubscription;
using RandevumKolay.Application.Features.Business.Commands.UpdateBusiness;
using RandevumKolay.Application.Features.Business.Commands.UpdateBusinessSettings;
using RandevumKolay.Application.Features.Business.Queries.GetBusiness;
using RandevumKolay.Application.Features.Tenants.Commands.ChangePlan;
using RandevumKolay.Application.Features.Users.Commands.DeactivateAccount;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class BusinessController : ControllerBase
{
    private readonly ISender _sender;

    public BusinessController(ISender sender) => _sender = sender;

    [HttpGet("me")]
    public async Task<IActionResult> GetBusiness(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetBusinessQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateBusiness(
        [FromBody] UpdateBusinessCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPatch("me/settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] Dictionary<string, string> settings,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateBusinessSettingsCommand(settings), cancellationToken);
        return NoContent();
    }

    [HttpPatch("me/plan")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePlan(
        [FromBody] ChangePlanCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("me/cancel-subscription")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelSubscription(CancellationToken cancellationToken = default)
    {
        await _sender.Send(new CancelSubscriptionCommand(), cancellationToken);
        return NoContent();
    }

    [HttpPost("me/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeactivateAccount(
        [FromBody] DeactivateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeactivateAccountCommand(request.Password), cancellationToken);
        return NoContent();
    }
}

public record DeactivateAccountRequest(string Password);
