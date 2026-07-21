using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Common.Interfaces;

/// <summary>
/// Zero-cost, deterministic replacement for <see cref="IClaudeService"/> once a
/// tenant's monthly free AI quota is exhausted. Drives the exact same real
/// services/availability data and produces the exact same
/// <see cref="WhatsAppBookingDraft"/> outcome via a slot-filling state machine
/// instead of an LLM call. Takes the tracked conversation entity directly
/// (rather than a stateless context DTO) since it reads/mutates the
/// conversation's automation-step fields as part of answering.
/// </summary>
public interface IFallbackBookingService
{
    Task<ClaudeBotReply> GetReplyAsync(WhatsAppConversation conversation, string incomingMessage, CancellationToken cancellationToken = default);
}
