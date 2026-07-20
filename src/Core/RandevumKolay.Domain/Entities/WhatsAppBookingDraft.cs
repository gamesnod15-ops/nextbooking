using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class WhatsAppBookingDraft : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ConversationId { get; private set; }
    public Guid ServiceId { get; private set; }
    public string ServiceName { get; private set; } = string.Empty;
    public DateOnly Date { get; private set; }
    public TimeOnly Time { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public string? CustomerEmail { get; private set; }
    public BookingDraftStatus Status { get; private set; } = BookingDraftStatus.PendingApproval;
    public string? RejectionReason { get; private set; }
    public Guid? CreatedAppointmentId { get; private set; }

    public WhatsAppConversation? Conversation { get; private set; }

    private WhatsAppBookingDraft() { }

    public static WhatsAppBookingDraft Create(
        Guid tenantId,
        Guid conversationId,
        Guid serviceId,
        string serviceName,
        DateOnly date,
        TimeOnly time,
        string customerName,
        string customerPhone,
        string? customerEmail)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(customerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(customerPhone);

        return new WhatsAppBookingDraft
        {
            TenantId = tenantId,
            ConversationId = conversationId,
            ServiceId = serviceId,
            ServiceName = serviceName,
            Date = date,
            Time = time,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            CustomerEmail = customerEmail
        };
    }

    public void Approve(Guid createdAppointmentId)
    {
        Status = BookingDraftStatus.Approved;
        CreatedAppointmentId = createdAppointmentId;
    }

    public void Reject(string? reason)
    {
        Status = BookingDraftStatus.Rejected;
        RejectionReason = reason;
    }
}
