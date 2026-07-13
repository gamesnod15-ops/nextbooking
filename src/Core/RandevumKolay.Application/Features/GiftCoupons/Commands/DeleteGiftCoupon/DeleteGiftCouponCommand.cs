using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.GiftCoupons.Commands.DeleteGiftCoupon;

public record DeleteGiftCouponCommand(Guid Id) : IRequest;

public sealed class DeleteGiftCouponCommandHandler : IRequestHandler<DeleteGiftCouponCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteGiftCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteGiftCouponCommand request, CancellationToken cancellationToken)
    {
        var giftCoupon = await _context.GiftCoupons
            .FirstOrDefaultAsync(g => g.Id == request.Id && g.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"GiftCoupon {request.Id} not found.");

        _context.GiftCoupons.Remove(giftCoupon);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
