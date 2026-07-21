using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Common.Interfaces;

public record ClaudeConversationTurn(MessageRole Role, string Text);

public record ClaudeBotContext(
    Guid ConversationId,
    string BusinessName,
    string? WelcomeMessage,
    IReadOnlyList<string> Services,
    IReadOnlyList<string> WorkingHours,
    IReadOnlyList<ClaudeConversationTurn> History,
    string IncomingMessage);

public record ClaudeBotReply(
    string ReplyText,
    string? ExtractedFieldsJson,
    int LeadScore,
    LeadTier LeadTier,
    bool ShouldEscalate,
    string? EscalationReason,
    int InputTokens = 0,
    int OutputTokens = 0);

public interface IClaudeService
{
    /// False when no Anthropic API key is configured — callers should skip
    /// straight to the fallback automation instead of making a call that's
    /// guaranteed to fail.
    bool IsConfigured { get; }

    Task<ClaudeBotReply> GetBotReplyAsync(ClaudeBotContext context, CancellationToken cancellationToken = default);
}
