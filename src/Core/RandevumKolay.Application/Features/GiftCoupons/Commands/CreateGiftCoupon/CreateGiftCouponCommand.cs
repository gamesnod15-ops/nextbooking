using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.GiftCoupons.Commands.CreateGiftCoupon;

public record CreateGiftCouponCommand(
    string Code,
    decimal Amount,
    string RecipientName,
    string? RecipientEmail,
    string PurchasedBy,
    DateTimeOffset? ExpiryDate,
    string? Message) : IRequest<Guid>;

public sealed class CreateGiftCouponCommandHandler : IRequestHandler<CreateGiftCouponCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateGiftCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateGiftCouponCommand request, CancellationToken cancellationToken)
    {
        var giftCoupon = GiftCoupon.Create(
            _tenantService.TenantId,
            request.Code,
            request.Amount,
            request.RecipientName,
            request.RecipientEmail,
            request.PurchasedBy,
            request.ExpiryDate,
            request.Message);

        _context.GiftCoupons.Add(giftCoupon);
        await _context.SaveChangesAsync(cancellationToken);

        return giftCoupon.Id;
    }
}

public class CreateGiftCouponCommandValidator : AbstractValidator<CreateGiftCouponCommand>
{
    public CreateGiftCouponCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PurchasedBy).NotEmpty().MaximumLength(200);
        RuleFor(x => x.RecipientEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.RecipientEmail));
    }
}
