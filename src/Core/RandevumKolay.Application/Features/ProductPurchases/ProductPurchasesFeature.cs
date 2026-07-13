using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.ProductPurchases;

public record PurchaseProductCommand(
    string ProductType,
    string PlanName,
    decimal Amount,
    string CustomerName,
    string? CustomerEmail = null,
    string? CustomerPhone = null) : IRequest<PurchaseResultDto>;

public record PurchaseResultDto(Guid PurchaseId, Guid ReceivableId, decimal Amount, string Description);

public record GetProductPurchasesQuery : IRequest<List<ProductPurchaseListItemDto>>;

public record ProductPurchaseListItemDto(
    Guid Id, string ProductType, string PlanName, decimal Amount,
    string Status, DateTimeOffset CreatedAt, DateTimeOffset? EndDate, Guid? ReceivableId);

public sealed class PurchaseProductCommandHandler : IRequestHandler<PurchaseProductCommand, PurchaseResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    private readonly IEmailService _emailService;

    public PurchaseProductCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenant,
        IEmailService emailService)
    {
        _context = context;
        _tenant = tenant;
        _emailService = emailService;
    }

    public async Task<PurchaseResultDto> Handle(PurchaseProductCommand request, CancellationToken ct)
    {
        var description = request.ProductType == "Sponsored"
            ? $"Sponsorlu Öne Çıkan - {request.PlanName}"
            : $"Reklamveren - {request.PlanName}";

        var receivable = Receivable.Create(
            _tenant.TenantId,
            request.CustomerName,
            request.Amount,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            1,
            request.CustomerPhone,
            description);
        receivable.AddPayment(request.Amount);
        _context.Receivables.Add(receivable);
        await _context.SaveChangesAsync(ct);

        var purchase = ProductPurchase.Create(
            _tenant.TenantId,
            request.ProductType,
            request.PlanName,
            request.Amount,
            receivable.Id);
        _context.ProductPurchases.Add(purchase);
        await _context.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.CustomerEmail))
        {
            var htmlBody = $"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family:sans-serif;padding:40px;background:#f9fafb;">
                    <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                        <h2 style="margin-top:0;color:#111827;">Satinalma Basarili</h2>
                        <p style="color:#6b7280;line-height:1.6;">
                            Merhaba <strong>{request.CustomerName}</strong>,<br>
                            <strong>{request.PlanName}</strong> paketini basariyla satin aldiniz.
                        </p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                            <tr><td style="padding:8px 0;color:#6b7280;">Paket</td><td style="padding:8px 0;font-weight:600;text-align:right;">{description}</td></tr>
                            <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Tutar</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">{request.Amount:N2} TL</td></tr>
                        </table>
                        <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                            Tesekkur ederiz.
                        </p>
                    </div>
                </body>
                </html>
                """;

            await _emailService.SendAsync(new EmailMessage(
                request.CustomerEmail,
                "RandevumKolay — Satinalma Basarili",
                htmlBody), ct);
        }

        return new PurchaseResultDto(purchase.Id, receivable.Id, request.Amount, description);
    }
}

public sealed class GetProductPurchasesQueryHandler
    : IRequestHandler<GetProductPurchasesQuery, List<ProductPurchaseListItemDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;

    public GetProductPurchasesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<List<ProductPurchaseListItemDto>> Handle(
        GetProductPurchasesQuery request, CancellationToken ct)
    {
        return await _context.ProductPurchases
            .AsNoTracking()
            .Where(p => p.TenantId == _tenant.TenantId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductPurchaseListItemDto(
                p.Id, p.ProductType, p.PlanName, p.Amount,
                p.Status.ToString(), p.CreatedAt, p.EndDate, p.ReceivableId))
            .ToListAsync(ct);
    }
}

public class PurchaseProductCommandValidator : AbstractValidator<PurchaseProductCommand>
{
    public PurchaseProductCommandValidator()
    {
        RuleFor(x => x.ProductType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.PlanName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(200);
    }
}
