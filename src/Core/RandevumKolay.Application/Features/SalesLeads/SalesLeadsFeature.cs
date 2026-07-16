using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.SalesLeads;

/// <summary>
/// "Satış Ekibiyle Görüş" (Kurumsal/custom plan) submissions. Public — the
/// requester may not have an account yet. Persisted for the sales team's
/// pipeline and emailed immediately so nothing waits on someone checking a table.
/// </summary>
public record CreateSalesLeadCommand(
    string CompanyName,
    string ContactName,
    string Phone,
    string Email,
    int? BranchCount,
    string? Message,
    Guid? TenantId = null) : IRequest<Guid>;

public sealed class CreateSalesLeadCommandHandler : IRequestHandler<CreateSalesLeadCommand, Guid>
{
    private const string SalesInboxEmail = "satis@nextbooking.com";

    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public CreateSalesLeadCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<Guid> Handle(CreateSalesLeadCommand request, CancellationToken cancellationToken)
    {
        var lead = SalesLead.Create(
            request.CompanyName,
            request.ContactName,
            request.Phone,
            request.Email,
            request.BranchCount,
            request.Message,
            planRequested: "custom",
            tenantId: request.TenantId);

        _context.SalesLeads.Add(lead);
        await _context.SaveChangesAsync(cancellationToken);

        // Notify the sales inbox. Best-effort: a delivery hiccup shouldn't fail
        // the request — the lead is already saved and visible in the pipeline.
        try
        {
            var branchLine = request.BranchCount.HasValue ? $"{request.BranchCount} şube" : "belirtilmedi";
            var htmlBody = $"""
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color:#111827;">Yeni Kurumsal Plan Talebi</h2>
                    <table style="width:100%; border-collapse: collapse; font-size: 14px; color:#374151;">
                        <tr><td style="padding:6px 0; font-weight:600;">İşletme</td><td>{request.CompanyName}</td></tr>
                        <tr><td style="padding:6px 0; font-weight:600;">Yetkili</td><td>{request.ContactName}</td></tr>
                        <tr><td style="padding:6px 0; font-weight:600;">Telefon</td><td>{request.Phone}</td></tr>
                        <tr><td style="padding:6px 0; font-weight:600;">E-posta</td><td>{request.Email}</td></tr>
                        <tr><td style="padding:6px 0; font-weight:600;">Şube Sayısı</td><td>{branchLine}</td></tr>
                    </table>
                    {(string.IsNullOrWhiteSpace(request.Message) ? "" : $"""<p style="margin-top:16px; color:#374151;"><strong>Mesaj:</strong><br/>{request.Message}</p>""")}
                </div>
                """;

            await _emailService.SendAsync(new Common.Interfaces.EmailMessage(
                SalesInboxEmail,
                $"Yeni Kurumsal Talep — {request.CompanyName}",
                htmlBody,
                ReplyTo: request.Email), cancellationToken);
        }
        catch
        {
            // Logged inside IEmailService implementation; lead is already persisted.
        }

        return lead.Id;
    }
}

public class CreateSalesLeadCommandValidator : AbstractValidator<CreateSalesLeadCommand>
{
    public CreateSalesLeadCommandValidator()
    {
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContactName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.BranchCount).GreaterThan(0).When(x => x.BranchCount.HasValue);
        RuleFor(x => x.Message).MaximumLength(2000).When(x => x.Message is not null);
    }
}
