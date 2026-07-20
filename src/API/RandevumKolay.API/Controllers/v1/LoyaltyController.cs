using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Loyalty.Commands.CreateLoyaltyMember;
using RandevumKolay.Application.Features.Loyalty.Commands.CreateLoyaltyReward;
using RandevumKolay.Application.Features.Loyalty.Commands.DeleteLoyaltyReward;
using RandevumKolay.Application.Features.Loyalty.Commands.RedeemReward;
using RandevumKolay.Application.Features.Loyalty.Commands.ToggleLoyaltyReward;
using RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyMembers;
using RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyOverview;
using RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyRewards;
using RandevumKolay.Application.Features.Loyalty.Queries.GetLoyaltyTiers;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ISender _sender;

    public LoyaltyController(ISender sender) => _sender = sender;

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetLoyaltyOverviewQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetMembers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetLoyaltyMembersQuery(pageNumber, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpPost("members")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMember(
        [FromBody] CreateLoyaltyMemberCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetMembers), new { id }, new { id });
    }

    [HttpGet("rewards")]
    public async Task<IActionResult> GetRewards(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetLoyaltyRewardsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("rewards")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateReward(
        [FromBody] CreateLoyaltyRewardCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetRewards), new { id }, new { id });
    }

    [HttpPut("rewards/{id:guid}/toggle")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ToggleReward(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ToggleLoyaltyRewardCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpDelete("rewards/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteReward(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteLoyaltyRewardCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("rewards/{id:guid}/redeem")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RedeemReward(
        Guid id,
        [FromBody] RedeemRewardRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new RedeemRewardCommand(request.MemberId, id), cancellationToken);
        return NoContent();
    }

    [HttpGet("tiers")]
    public async Task<IActionResult> GetTiers(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetLoyaltyTiersQuery(), cancellationToken);
        return Ok(result);
    }

    public record RedeemRewardRequest(Guid MemberId);
}
