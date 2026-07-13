using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class UserAuthProvider : BaseEntity
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public string Provider { get; private set; } = string.Empty;
    public string ProviderUserId { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? FullName { get; private set; }
    public string? AvatarUrl { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; private set; }

    private UserAuthProvider() { }

    public static UserAuthProvider Create(
        Guid userId,
        string provider,
        string providerUserId,
        string? email = null,
        string? fullName = null,
        string? avatarUrl = null)
    {
        return new UserAuthProvider
        {
            UserId = userId,
            Provider = provider,
            ProviderUserId = providerUserId,
            Email = email,
            FullName = fullName,
            AvatarUrl = avatarUrl
        };
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTimeOffset.UtcNow;
    }

    public void UpdateProfile(string? fullName, string? avatarUrl)
    {
        if (fullName is not null) FullName = fullName;
        if (avatarUrl is not null) AvatarUrl = avatarUrl;
    }
}
