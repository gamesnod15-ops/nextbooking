using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Survey : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public string? CustomerName { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public bool IsApproved { get; private set; }

    private Survey() { }

    public static Survey Create(
        Guid tenantId,
        Guid businessId,
        int rating,
        string? customerName = null,
        Guid? appointmentId = null,
        string? comment = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5.");

        return new Survey
        {
            TenantId = tenantId,
            BusinessId = businessId,
            AppointmentId = appointmentId,
            CustomerName = customerName,
            Rating = rating,
            Comment = comment,
            IsApproved = true,
        };
    }

    public void Approve() => IsApproved = true;
    public void Reject() => IsApproved = false;
}
