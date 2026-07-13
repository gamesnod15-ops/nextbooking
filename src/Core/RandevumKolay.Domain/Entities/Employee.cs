using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Employee : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid? UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Title { get; private set; }
    public string? Bio { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool AcceptsOnlineBookings { get; private set; } = true;

    private readonly List<EmployeeService> _employeeServices = new();
    public IReadOnlyList<EmployeeService> EmployeeServices => _employeeServices.AsReadOnly();

    private readonly List<Schedule> _schedules = new();
    public IReadOnlyList<Schedule> Schedules => _schedules.AsReadOnly();

    private Employee() { }

    public static Employee Create(
        Guid tenantId,
        Guid businessId,
        string name,
        string? title = null,
        string? email = null,
        string? phone = null)
    {
        return new Employee
        {
            TenantId = tenantId,
            BusinessId = businessId,
            Name = name,
            Title = title,
            Email = email,
            Phone = phone
        };
    }

    public void LinkUser(Guid userId) => UserId = userId;
    public void SetAvatar(string avatarUrl) => AvatarUrl = avatarUrl;

    public void Update(string name, string? title, string? bio, string? phone, string? email)
    {
        Name = name;
        Title = title;
        Bio = bio;
        Phone = phone;
        Email = email;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
