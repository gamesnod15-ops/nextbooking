using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.WhatsAppConversations.Commands.EscalateConversation;
using RandevumKolay.Application.Features.WhatsAppConversations.Commands.ResolveConversation;
using RandevumKolay.Application.Features.WhatsAppConversations.Commands.SendMessage;
using RandevumKolay.Application.Features.WhatsAppConversations.Queries.GetConversationMessages;
using RandevumKolay.Application.Features.WhatsAppConversations.Queries.GetConversations;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/whatsapp-conversations")]
[ApiController]
[Authorize]
public class WhatsAppConversationsController : ControllerBase
{
    private readonly ISender _sender;

    public WhatsAppConversationsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ConversationStatus? status = null,
        [FromQuery] LeadTier? leadTier = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetConversationsQuery(pageNumber, pageSize, status, leadTier), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetConversationMessagesQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/escalate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Escalate(Guid id, [FromBody] EscalateConversationRequest request, CancellationToken cancellationToken)
    {
        await _sender.Send(new EscalateConversationCommand(id, request.Reason), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Resolve(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new ResolveConversationCommand(id), cancellationToken);
        return NoContent();
    }
}

public record EscalateConversationRequest(string Reason);
