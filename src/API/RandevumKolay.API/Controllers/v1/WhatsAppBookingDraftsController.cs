using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WhatsAppBookingDrafts.Commands.ApproveBookingDraft;
using RandevumKolay.Application.Features.WhatsAppBookingDrafts.Commands.RejectBookingDraft;
using RandevumKolay.Application.Features.WhatsAppBookingDrafts.Queries.GetBookingDrafts;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/whatsapp-booking-drafts")]
[ApiController]
[Authorize]
public class WhatsAppBookingDraftsController : ControllerBase
{
    private readonly ISender _sender;

    public WhatsAppBookingDraftsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookingDrafts(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] BookingDraftStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetBookingDraftsQuery(pageNumber, pageSize, status), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var appointmentId = await _sender.Send(new ApproveBookingDraftCommand(id), cancellationToken);
        return Ok(new { appointmentId });
    }

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectBookingDraftRequest? request, CancellationToken cancellationToken)
    {
        await _sender.Send(new RejectBookingDraftCommand(id, request?.Reason), cancellationToken);
        return NoContent();
    }
}

public record RejectBookingDraftRequest(string? Reason);
