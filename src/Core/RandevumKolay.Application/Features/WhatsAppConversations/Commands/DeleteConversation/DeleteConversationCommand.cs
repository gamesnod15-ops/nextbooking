using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Commands.DeleteConversation;

/// <summary>
/// Hard-deletes a conversation. Its messages and any booking drafts cascade
/// at the DB level (both relationships are configured with
/// DeleteBehavior.Cascade), so nothing else needs cleaning up here.
/// </summary>
public record DeleteConversationCommand(Guid Id) : IRequest;

public sealed class DeleteConversationCommandHandler : IRequestHandler<DeleteConversationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteConversationCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteConversationCommand request, CancellationToken cancellationToken)
    {
        var conversation = await _context.WhatsAppConversations
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(WhatsAppConversation), request.Id);

        _context.WhatsAppConversations.Remove(conversation);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
