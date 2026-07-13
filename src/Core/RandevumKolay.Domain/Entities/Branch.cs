using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Branch : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? ManagerName { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool IsMainBranch { get; private set; }

    private Branch() { }

    public static Branch Create(
        Guid tenantId,
        string name,
        bool isMainBranch = false,
        string? address = null,
        string? city = null,
        string? phone = null,
        string? email = null,
        string? managerName = null)
    {
        return new Branch
        {
            TenantId = tenantId,
            Name = name,
            IsMainBranch = isMainBranch,
            Address = address,
            City = city,
            Phone = phone,
            Email = email,
            ManagerName = managerName
        };
    }

    public void Update(string name, string? address, string? city, string? phone,
        string? email, string? managerName)
    {
        Name = name;
        Address = address;
        City = city;
        Phone = phone;
        Email = email;
        ManagerName = managerName;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
