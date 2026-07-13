using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Customer : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? Notes { get; private set; }
    public string? AvatarUrl { get; private set; }
    public DateOnly? BirthDate { get; private set; }
    public string? Gender { get; private set; }
    public List<string> Tags { get; private set; } = new();
    public bool IsBlocked { get; private set; }
    public DateTimeOffset? LastVisitAt { get; private set; }
    public int TotalVisits { get; private set; }
    public decimal TotalSpent { get; private set; }

    private Customer() { }

    public static Customer Create(
        Guid tenantId,
        string name,
        string phone,
        string? email = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        return new Customer
        {
            TenantId = tenantId,
            Name = name,
            Phone = phone,
            Email = email
        };
    }

    public void Update(string name, string phone, string? email, string? notes, DateOnly? birthDate)
    {
        Name = name;
        Phone = phone;
        Email = email;
        Notes = notes;
        BirthDate = birthDate;
    }

    public void RecordVisit(decimal amount)
    {
        TotalVisits++;
        TotalSpent += amount;
        LastVisitAt = DateTimeOffset.UtcNow;
    }

    public void Block() => IsBlocked = true;
    public void Unblock() => IsBlocked = false;
    public void AddTag(string tag) { if (!Tags.Contains(tag)) Tags.Add(tag); }
    public void RemoveTag(string tag) => Tags.Remove(tag);
}
