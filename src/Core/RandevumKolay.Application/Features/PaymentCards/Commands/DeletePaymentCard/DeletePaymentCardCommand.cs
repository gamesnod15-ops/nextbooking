using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.PaymentCards.Commands.DeletePaymentCard;

public record DeletePaymentCardCommand(Guid Id) : IRequest;

public sealed class DeletePaymentCardCommandHandler : IRequestHandler<DeletePaymentCardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeletePaymentCardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeletePaymentCardCommand request, CancellationToken cancellationToken)
    {
        var card = await _context.PaymentCards
            .Where(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Payment card not found.");

        _context.PaymentCards.Remove(card);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
