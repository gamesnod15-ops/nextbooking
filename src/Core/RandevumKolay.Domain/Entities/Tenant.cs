using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Subdomain { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Plan { get; private set; } = "starter";
    public bool IsActive { get; private set; } = true;
    public string? LogoUrl { get; private set; }
    public string? CustomDomain { get; private set; }
    public Dictionary<string, string> Settings { get; private set; } = new();
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? TrialEndsAt { get; private set; }
    public DateTimeOffset? SubscriptionEndsAt { get; private set; }

    private readonly List<Business> _businesses = new();
    public IReadOnlyList<Business> Businesses => _businesses.AsReadOnly();

    private Tenant() { }

    public static Tenant Create(string name, string subdomain, string email, string plan = "starter")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(subdomain);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        return new Tenant
        {
            Name = name,
            Subdomain = subdomain.ToLowerInvariant(),
            Email = email,
            Plan = plan,
            TrialEndsAt = DateTimeOffset.UtcNow.AddDays(14)
        };
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;

    public void UpdateSettings(string key, string value)
    {
        Settings[key] = value;
    }

    public void SetCustomDomain(string domain)
    {
        CustomDomain = domain?.ToLowerInvariant();
    }

    public void ExtendSubscription(DateTimeOffset endsAt, string plan)
    {
        Plan = plan;
        SubscriptionEndsAt = endsAt;
    }
}
