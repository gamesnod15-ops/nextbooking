using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Common.Interfaces;

public record ClaudeConversationTurn(MessageRole Role, string Text);

public record ClaudeBotContext(
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
    string? EscalationReason);

public interface IClaudeService
{
    Task<ClaudeBotReply> GetBotReplyAsync(ClaudeBotContext context, CancellationToken cancellationToken = default);
}
