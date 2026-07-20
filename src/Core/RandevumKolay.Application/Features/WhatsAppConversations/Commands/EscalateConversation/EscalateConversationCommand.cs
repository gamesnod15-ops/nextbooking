using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Commands.EscalateConversation;

public record EscalateConversationCommand(Guid ConversationId, string Reason) : IRequest;

public sealed class EscalateConversationCommandHandler : IRequestHandler<EscalateConversationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public EscalateConversationCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(EscalateConversationCommand request, CancellationToken cancellationToken)
    {
        var conversation = await _context.WhatsAppConversations
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WhatsAppConversation), request.ConversationId);

        conversation.Escalate(request.Reason);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
