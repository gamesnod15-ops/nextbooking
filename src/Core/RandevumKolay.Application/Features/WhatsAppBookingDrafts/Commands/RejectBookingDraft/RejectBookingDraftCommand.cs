using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppBookingDrafts.Commands.RejectBookingDraft;

public record RejectBookingDraftCommand(Guid DraftId, string? Reason) : IRequest;

public sealed class RejectBookingDraftCommandHandler : IRequestHandler<RejectBookingDraftCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public RejectBookingDraftCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(RejectBookingDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await _context.WhatsAppBookingDrafts
            .FirstOrDefaultAsync(d => d.Id == request.DraftId && d.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WhatsAppBookingDraft), request.DraftId);

        draft.Reject(request.Reason);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
