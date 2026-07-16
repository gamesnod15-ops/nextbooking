using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum SalesLeadStatus { New, Contacted, Closed }

/// <summary>
/// A "contact sales" request from the pricing page (custom/Kurumsal plan).
/// Not tenant-scoped: the requester may not have an account yet, and this is
/// only ever read by internal staff.
/// </summary>
public class SalesLead : AuditableEntity
{
    public string CompanyName { get; private set; } = string.Empty;
    public string ContactName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public int? BranchCount { get; private set; }
    public string? Message { get; private set; }
    public string PlanRequested { get; private set; } = "custom";
    public SalesLeadStatus Status { get; private set; } = SalesLeadStatus.New;
    /// Set when the requester was already logged in (upgrade flow from the panel).
    public Guid? TenantId { get; private set; }

    private SalesLead() { }

    public static SalesLead Create(
        string companyName,
        string contactName,
        string phone,
        string email,
        int? branchCount = null,
        string? message = null,
        string planRequested = "custom",
        Guid? tenantId = null)
    {
        return new SalesLead
        {
            CompanyName = companyName,
            ContactName = contactName,
            Phone = phone,
            Email = email,
            BranchCount = branchCount,
            Message = message,
            PlanRequested = planRequested,
            TenantId = tenantId,
            Status = SalesLeadStatus.New,
        };
    }

    public void MarkContacted() => Status = SalesLeadStatus.Contacted;
    public void Close() => Status = SalesLeadStatus.Closed;
}
