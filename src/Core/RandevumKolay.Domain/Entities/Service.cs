using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Service : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int DurationMinutes { get; private set; }
    public int BufferMinutes { get; private set; }
    public decimal Price { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? Color { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool RequiresConfirmation { get; private set; }
    public int? MaxCapacity { get; private set; }

    private readonly List<EmployeeService> _employeeServices = new();
    public IReadOnlyList<EmployeeService> EmployeeServices => _employeeServices.AsReadOnly();

    private Service() { }

    public static Service Create(
        Guid tenantId,
        Guid businessId,
        string name,
        int durationMinutes,
        decimal price,
        int bufferMinutes = 0,
        string? description = null)
    {
        return new Service
        {
            TenantId = tenantId,
            BusinessId = businessId,
            Name = name,
            DurationMinutes = durationMinutes,
            Price = price,
            BufferMinutes = bufferMinutes,
            Description = description
        };
    }

    public void Update(string name, string? description, int durationMinutes,
        decimal price, int bufferMinutes, bool requiresConfirmation)
    {
        Name = name;
        Description = description;
        DurationMinutes = durationMinutes;
        Price = price;
        BufferMinutes = bufferMinutes;
        RequiresConfirmation = requiresConfirmation;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
    public void SetColor(string color) => Color = color;
    public void SetImage(string imageUrl) => ImageUrl = imageUrl;
    public void SetSortOrder(int order) => SortOrder = order;
}
