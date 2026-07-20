using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Features.Appointments.Commands.CreateAppointment;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.WhatsAppBookingDrafts.Commands.ApproveBookingDraft;

public record ApproveBookingDraftCommand(Guid DraftId) : IRequest<Guid>;

public sealed class ApproveBookingDraftCommandHandler : IRequestHandler<ApproveBookingDraftCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly ISender _sender;

    public ApproveBookingDraftCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService, ISender sender)
    {
        _context = context;
        _tenantService = tenantService;
        _sender = sender;
    }

    public async Task<Guid> Handle(ApproveBookingDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await _context.WhatsAppBookingDrafts
            .FirstOrDefaultAsync(d => d.Id == request.DraftId && d.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.WhatsAppBookingDraft), request.DraftId);

        if (draft.Status != BookingDraftStatus.PendingApproval)
            throw new ConflictException("Bu randevu talebi zaten işleme alınmış.");

        var nameParts = draft.CustomerName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "Müşteri";
        var lastName = nameParts.Length > 1 ? nameParts[1] : "-";
        var email = draft.CustomerEmail ?? $"wa{draft.CustomerPhone.Replace(" ", "").Replace("-", "")}@nextbooking.app";

        // ConflictException from CreateAppointmentCommand (slot taken since the draft
        // was created) is intentionally left to propagate — the draft stays
        // PendingApproval so the owner sees it failed and can act manually.
        var appointmentId = await _sender.Send(new CreateAppointmentCommand(
            draft.ServiceId,
            null,
            draft.Date.ToString("yyyy-MM-dd"),
            draft.Time.ToString("HH:mm"),
            firstName,
            lastName,
            draft.CustomerPhone,
            email,
            Notes: $"WhatsApp bot randevusu · {draft.ServiceName}",
            Source: "whatsapp"), cancellationToken);

        draft.Approve(appointmentId);
        await _context.SaveChangesAsync(cancellationToken);

        return appointmentId;
    }
}
