using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Surveys;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class SurveysController : ControllerBase
{
    private readonly ISender _sender;
    public SurveysController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetSurveys([FromQuery] bool? isApproved = null, CancellationToken ct = default)
        => Ok(await _sender.Send(new GetSurveysQuery(isApproved), ct));

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateSurvey([FromBody] CreateSurveyCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetSurveys), new { id }, new { id });
    }

    [HttpPatch("{id:guid}/approval")]
    public async Task<IActionResult> SetApproval(Guid id, [FromBody] ApprovalRequest body, CancellationToken ct)
    {
        await _sender.Send(new SetSurveyApprovalCommand(id, body.IsApproved), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSurvey(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteSurveyCommand(id), ct);
        return NoContent();
    }

    public record ApprovalRequest(bool IsApproved);
}
