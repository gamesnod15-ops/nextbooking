using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.GiftCoupons.Commands.UpdateGiftCoupon;

public record UpdateGiftCouponCommand(
    Guid Id,
    string RecipientName,
    string? RecipientEmail,
    string PurchasedBy,
    DateTimeOffset? ExpiryDate,
    string? Message) : IRequest<Unit>;

public sealed class UpdateGiftCouponCommandHandler : IRequestHandler<UpdateGiftCouponCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateGiftCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Unit> Handle(UpdateGiftCouponCommand request, CancellationToken cancellationToken)
    {
        var giftCoupon = await _context.GiftCoupons.FindAsync([request.Id], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.GiftCoupon), request.Id);

        if (giftCoupon.TenantId != _tenantService.TenantId)
            throw new ForbiddenAccessException();

        giftCoupon.Update(
            request.RecipientName,
            request.RecipientEmail,
            request.PurchasedBy,
            request.ExpiryDate,
            request.Message);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

public class UpdateGiftCouponCommandValidator : AbstractValidator<UpdateGiftCouponCommand>
{
    public UpdateGiftCouponCommandValidator()
    {
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PurchasedBy).NotEmpty().MaximumLength(200);
        RuleFor(x => x.RecipientEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.RecipientEmail));
    }
}
