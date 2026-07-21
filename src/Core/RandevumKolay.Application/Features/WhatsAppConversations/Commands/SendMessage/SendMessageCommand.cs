using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Commands.SendMessage;

public record SendMessageCommand(
    Guid? ConversationId,
    string CustomerPhone,
    string? CustomerName,
    string Text,
    MessageRole Role,
    string BusinessName,
    string? WelcomeMessage,
    List<string> Services,
    List<string> WorkingHours) : IRequest<SendMessageResult>;

public record MessageDto(Guid Id, MessageRole Role, string Text, DateTimeOffset CreatedAt);

public record SendMessageResult(
    Guid ConversationId,
    ConversationStatus Status,
    int LeadScore,
    LeadTier LeadTier,
    string? EscalationReason,
    List<MessageDto> NewMessages);

public sealed class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, SendMessageResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly IClaudeService _claudeService;
    private readonly IFallbackBookingService _fallbackBookingService;
    private readonly IAiUsageService _aiUsageService;
    private readonly INotificationService _notificationService;

    public SendMessageCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        IClaudeService claudeService,
        IFallbackBookingService fallbackBookingService,
        IAiUsageService aiUsageService,
        INotificationService notificationService)
    {
        _context = context;
        _tenantService = tenantService;
        _claudeService = claudeService;
        _fallbackBookingService = fallbackBookingService;
        _aiUsageService = aiUsageService;
        _notificationService = notificationService;
    }

    public async Task<SendMessageResult> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;

        var conversation = request.ConversationId.HasValue
            ? await _context.WhatsAppConversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value && c.TenantId == tenantId, cancellationToken)
            : await _context.WhatsAppConversations
                .Include(c => c.Messages)
                .Where(c => c.TenantId == tenantId && c.CustomerPhone == request.CustomerPhone && c.Status != ConversationStatus.Closed)
                .OrderByDescending(c => c.LastMessageAt)
                .FirstOrDefaultAsync(cancellationToken);

        if (conversation is null)
        {
            var existingCustomer = await _context.Customers
                .Where(c => c.TenantId == tenantId && c.Phone == request.CustomerPhone)
                .FirstOrDefaultAsync(cancellationToken);

            conversation = WhatsAppConversation.Create(tenantId, request.CustomerPhone, request.CustomerName, existingCustomer?.Id);
            _context.WhatsAppConversations.Add(conversation);
        }

        // Snapshot history before appending the new message, so Claude sees
        // prior turns only — the incoming message is passed separately.
        var history = conversation.Messages
            .OrderBy(m => m.Sequence)
            .Select(m => new ClaudeConversationTurn(m.Role, m.Text))
            .ToList();
        var nextSequence = conversation.Messages.Count;

        var newMessages = new List<MessageDto>();

        var incomingMessage = WhatsAppMessage.Create(tenantId, conversation.Id, nextSequence++, request.Role, request.Text);
        _context.WhatsAppMessages.Add(incomingMessage);
        newMessages.Add(new MessageDto(incomingMessage.Id, incomingMessage.Role, incomingMessage.Text, incomingMessage.CreatedAt));
        conversation.TouchLastMessage();

        if (request.Role == MessageRole.Customer && conversation.Status != ConversationStatus.Closed)
        {
            // Once a conversation has entered the deterministic fallback flow,
            // it stays there until that flow concludes (booked/escalated) —
            // even if the monthly quota resets mid-conversation — to avoid
            // switching "brains" partway through. Fresh conversations always
            // re-check quota.
            var useAi = conversation.AutomationStep != AutomationStep.None
                ? false
                : await _aiUsageService.HasQuotaRemainingAsync(tenantId, cancellationToken);

            ClaudeBotReply reply;
            if (useAi)
            {
                var claudeContext = new ClaudeBotContext(
                    conversation.Id,
                    request.BusinessName,
                    request.WelcomeMessage,
                    request.Services,
                    request.WorkingHours,
                    history,
                    request.Text);

                reply = await _claudeService.GetBotReplyAsync(claudeContext, cancellationToken);
                await _aiUsageService.RecordUsageAsync(tenantId, reply.InputTokens, reply.OutputTokens, cancellationToken);
            }
            else
            {
                reply = await _fallbackBookingService.GetReplyAsync(conversation, request.Text, cancellationToken);
            }

            var botMessage = WhatsAppMessage.Create(tenantId, conversation.Id, nextSequence++, MessageRole.Bot, reply.ReplyText, reply.ExtractedFieldsJson);
            _context.WhatsAppMessages.Add(botMessage);
            newMessages.Add(new MessageDto(botMessage.Id, botMessage.Role, botMessage.Text, botMessage.CreatedAt));

            var wasEscalated = conversation.Status == ConversationStatus.Escalated;
            conversation.ApplyBotAssessment(reply.LeadScore, reply.LeadTier, reply.ShouldEscalate, reply.EscalationReason);

            if (!wasEscalated && conversation.Status == ConversationStatus.Escalated)
            {
                await _notificationService.SendRealtimeNotificationAsync(
                    tenantId,
                    "WhatsAppConversationEscalated",
                    new
                    {
                        conversationId = conversation.Id,
                        customerName = conversation.CustomerName ?? conversation.CustomerPhone,
                        reason = conversation.EscalationReason
                    },
                    cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new SendMessageResult(
            conversation.Id,
            conversation.Status,
            conversation.LeadScore,
            conversation.LeadTier,
            conversation.EscalationReason,
            newMessages);
    }
}
