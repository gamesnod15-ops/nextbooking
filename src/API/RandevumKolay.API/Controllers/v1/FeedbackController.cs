using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Feedbacks;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/feedback")]
[ApiController]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly ISender _sender;
    public FeedbackController(ISender sender) => _sender = sender;

    /// <summary>Product feedback submitted from the business panel's feedback widget.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFeedback(
        [FromBody] CreateFeedbackCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return Created(string.Empty, new { id });
    }
}
