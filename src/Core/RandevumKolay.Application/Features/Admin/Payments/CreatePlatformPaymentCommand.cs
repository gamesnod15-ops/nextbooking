using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Payments;

/// <summary>Manually records a platform revenue entry — used for advertiser
/// and sponsorship deals, which are sold off-platform and have no self-serve
/// checkout yet. Subscription entries are normally created by
/// <see cref="SyncSubscriptionPaymentsCommand"/>, but can also be logged here.</summary>
public record CreatePlatformPaymentCommand(
    PlatformPaymentType Type,
    string PayerName,
    decimal Amount,
    string Currency,
    Guid? TenantId,
    string? Description,
    PlatformPaymentStatus Status,
    string? BillingAddress = null,
    string? BillingCity = null,
    string? BillingCountry = null,
    string? TaxNumber = null,
    string? TaxOffice = null) : IRequest<Guid>;

public sealed class CreatePlatformPaymentCommandHandler : IRequestHandler<CreatePlatformPaymentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreatePlatformPaymentCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(CreatePlatformPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = PlatformPayment.Create(
            request.Type,
            request.PayerName,
            request.Amount,
            request.Currency,
            request.TenantId,
            request.Description,
            request.Status,
            request.BillingAddress,
            request.BillingCity,
            request.BillingCountry,
            request.TaxNumber,
            request.TaxOffice);

        _context.PlatformPayments.Add(payment);
        await _context.SaveChangesAsync(cancellationToken);

        return payment.Id;
    }
}

public class CreatePlatformPaymentCommandValidator : AbstractValidator<CreatePlatformPaymentCommand>
{
    public CreatePlatformPaymentCommandValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.PayerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Currency).NotEmpty().MaximumLength(10);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.BillingAddress).MaximumLength(500);
        RuleFor(x => x.BillingCity).MaximumLength(100);
        RuleFor(x => x.BillingCountry).MaximumLength(100);
        RuleFor(x => x.TaxNumber).MaximumLength(50);
        RuleFor(x => x.TaxOffice).MaximumLength(100);
    }
}
