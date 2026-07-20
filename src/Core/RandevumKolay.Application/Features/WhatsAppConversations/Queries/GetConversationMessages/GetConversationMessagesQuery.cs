using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Queries.GetConversationMessages;

public record GetConversationMessagesQuery(Guid ConversationId) : IRequest<List<ConversationMessageDto>>;

public record ConversationMessageDto(Guid Id, MessageRole Role, string Text, DateTimeOffset CreatedAt);

public sealed class GetConversationMessagesQueryHandler
    : IRequestHandler<GetConversationMessagesQuery, List<ConversationMessageDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetConversationMessagesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<ConversationMessageDto>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        var conversationExists = await _context.WhatsAppConversations
            .AsNoTracking()
            .AnyAsync(c => c.Id == request.ConversationId && c.TenantId == _tenantService.TenantId, cancellationToken);

        if (!conversationExists)
            throw new NotFoundException(nameof(Domain.Entities.WhatsAppConversation), request.ConversationId);

        return await _context.WhatsAppMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == request.ConversationId && m.TenantId == _tenantService.TenantId)
            .OrderBy(m => m.Sequence)
            .Select(m => new ConversationMessageDto(m.Id, m.Role, m.Text, m.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
