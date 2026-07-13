using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class FormSubmission : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid FormId { get; private set; }
    public string? CustomerName { get; private set; }
    public string? CustomerPhone { get; private set; }
    public Dictionary<string, string> Data { get; private set; } = new();

    private FormSubmission() { }

    public static FormSubmission Create(
        Guid tenantId,
        Guid formId,
        Dictionary<string, string> data,
        string? customerName = null,
        string? customerPhone = null)
    {
        return new FormSubmission
        {
            TenantId = tenantId,
            FormId = formId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Data = data,
        };
    }
}
