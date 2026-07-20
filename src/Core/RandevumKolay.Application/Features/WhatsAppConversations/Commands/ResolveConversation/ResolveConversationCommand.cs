using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Commands.ResolveConversation;

public record ResolveConversationCommand(Guid ConversationId) : IRequest;

public sealed class ResolveConversationCommandHandler : IRequestHandler<ResolveConversationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ResolveConversationCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ResolveConversationCommand request, CancellationToken cancellationToken)
    {
        var conversation = await _context.WhatsAppConversations
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WhatsAppConversation), request.ConversationId);

        conversation.Resolve();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
