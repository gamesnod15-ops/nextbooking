using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.PaymentCards.Commands.SetDefaultPaymentCard;

public record SetDefaultPaymentCardCommand(Guid Id) : IRequest;

public sealed class SetDefaultPaymentCardCommandHandler : IRequestHandler<SetDefaultPaymentCardCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public SetDefaultPaymentCardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(SetDefaultPaymentCardCommand request, CancellationToken cancellationToken)
    {
        var cards = await _context.PaymentCards
            .Where(c => c.TenantId == _tenantService.TenantId)
            .ToListAsync(cancellationToken);

        var target = cards.FirstOrDefault(c => c.Id == request.Id)
            ?? throw new KeyNotFoundException("Payment card not found.");

        foreach (var card in cards)
            card.RemoveDefault();

        target.SetAsDefault();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
