using RandevumKolay.Domain.Common;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Domain.Entities;

public class Business : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public BusinessCategory Category { get; private set; }
    public string Timezone { get; private set; } = "Europe/Istanbul";
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? PostalCode { get; private set; }
    public string? Country { get; private set; }
    public string? TaxNumber { get; private set; }
    public string? TaxOffice { get; private set; }
    public string? Website { get; private set; }
    public string? LogoUrl { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public List<string> GalleryImages { get; private set; } = new();
    public Dictionary<string, string> Settings { get; private set; } = new();

    private readonly List<Service> _services = new();
    public IReadOnlyList<Service> Services => _services.AsReadOnly();

    private readonly List<Employee> _employees = new();
    public IReadOnlyList<Employee> Employees => _employees.AsReadOnly();

    private readonly List<Review> _reviews = new();
    public IReadOnlyList<Review> Reviews => _reviews.AsReadOnly();

    private Business() { }

    public static Business Create(
        Guid tenantId,
        string name,
        BusinessCategory category,
        string timezone = "Europe/Istanbul")
    {
        return new Business
        {
            TenantId = tenantId,
            Name = name,
            Category = category,
            Timezone = timezone
        };
    }

    public void Update(
        string name,
        string? phone,
        string? email,
        string? address,
        string? city,
        string? postalCode,
        string? country,
        string? taxNumber,
        string? taxOffice,
        string? website,
        string? description)
    {
        Name = name;
        Phone = phone;
        Email = email;
        Address = address;
        City = city;
        PostalCode = postalCode;
        Country = country;
        TaxNumber = taxNumber;
        TaxOffice = taxOffice;
        Website = website;
        Description = description;
    }

    public void SetLogo(string logoUrl) => LogoUrl = logoUrl;

    public void SetGalleryImages(List<string> images) => GalleryImages = images;

    public void UpsertSettings(Dictionary<string, string> updates)
    {
        var copy = new Dictionary<string, string>(Settings);
        foreach (var kv in updates)
            copy[kv.Key] = kv.Value;
        Settings = copy;
    }
}
