using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class FormField
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool Required { get; set; }
    public List<string>? Options { get; set; }
    public int SortOrder { get; set; }
}

public class CustomForm : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public List<FormField> Fields { get; private set; } = new();
    public bool IsActive { get; private set; } = true;

    private CustomForm() { }

    public static CustomForm Create(
        Guid tenantId,
        Guid businessId,
        string title,
        List<FormField> fields,
        string? description = null)
    {
        return new CustomForm
        {
            TenantId = tenantId,
            BusinessId = businessId,
            Title = title,
            Description = description,
            Fields = fields,
            IsActive = true,
        };
    }

    public void Update(string title, string? description, List<FormField> fields)
    {
        Title = title;
        Description = description;
        Fields = fields;
    }

    public void SetActive(bool active) => IsActive = active;
}
