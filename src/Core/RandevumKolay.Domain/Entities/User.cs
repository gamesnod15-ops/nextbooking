using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class User : AuditableEntity
{
    public Guid? TenantId { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? JobTitle { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string Role { get; private set; } = "employee";
    public bool IsActive { get; private set; } = true;
    public bool EmailVerified { get; private set; }
    public bool PhoneVerified { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }
    public List<string> Permissions { get; private set; } = new();

    private readonly List<RefreshToken> _refreshTokens = new();
    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    public string FullName => $"{FirstName} {LastName}".Trim();

    private User() { }

    public static User Create(
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string role = "employee",
        Guid? tenantId = null)
    {
        return new User
        {
            Email = email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            TenantId = tenantId
        };
    }

    public void RecordLogin() => LastLoginAt = DateTimeOffset.UtcNow;
    public void VerifyEmail() => EmailVerified = true;
    public void SetAvatar(string? url) => AvatarUrl = url;
    public void UpdatePassword(string hash) => PasswordHash = hash;
    public void UpdateEmail(string email) => Email = email.ToLowerInvariant();
    public void UpdateProfile(string firstName, string lastName, string? phone, string? jobTitle)
    {
        FirstName = firstName;
        LastName = lastName;
        Phone = phone;
        JobTitle = jobTitle;
    }
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;

    /// <summary>
    /// Attaches an existing account (e.g. one created via a customer/OAuth
    /// signup with no business) to a newly created tenant, upgrading its role
    /// in place rather than requiring a brand-new user record.
    /// </summary>
    public void AssignToTenant(Guid tenantId, string role)
    {
        TenantId = tenantId;
        Role = role;
    }

    public void AddPermission(string permission)
    {
        if (!Permissions.Contains(permission))
            Permissions.Add(permission);
    }

    public void RemovePermission(string permission) => Permissions.Remove(permission);
}
