using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WinBackRules.Commands.CreateWinBackRule;
using RandevumKolay.Application.Features.WinBackRules.Commands.DeleteWinBackRule;
using RandevumKolay.Application.Features.WinBackRules.Commands.UpdateWinBackRule;
using RandevumKolay.Application.Features.WinBackRules.Queries.GetWinBackRules;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/win-back-rules")]
[ApiController]
[Authorize]
public class WinBackRulesController : ControllerBase
{
    private readonly ISender _sender;

    public WinBackRulesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetWinBackRules(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetWinBackRulesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateWinBackRule(
        [FromBody] CreateWinBackRuleCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetWinBackRules), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateWinBackRule(
        Guid id,
        [FromBody] UpdateWinBackRuleRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateWinBackRuleCommand(id, request.DaysSinceLastVisit, request.MessageTemplate, request.IsActive), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteWinBackRule(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteWinBackRuleCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateWinBackRuleRequest(int DaysSinceLastVisit, string MessageTemplate, bool IsActive);
}
