using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// An Expo push token for one app install. Keyed by device so a guest customer
/// (who has no account) can still receive appointment reminders.
/// </summary>
public class PushToken : BaseEntity
{
    public string DeviceId { get; private set; } = string.Empty;
    public string Token { get; private set; } = string.Empty;
    public Guid? UserId { get; private set; }
    public string Platform { get; private set; } = "unknown";
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeenAt { get; private set; } = DateTimeOffset.UtcNow;

    private PushToken() { }

    public static PushToken Create(string deviceId, string token, string platform, Guid? userId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deviceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        return new PushToken
        {
            DeviceId = deviceId.Trim(),
            Token = token.Trim(),
            Platform = string.IsNullOrWhiteSpace(platform) ? "unknown" : platform.Trim(),
            UserId = userId,
        };
    }

    /// <summary>Refreshes an existing registration when the same device reports in again.</summary>
    public void Refresh(string token, string platform, Guid? userId)
    {
        if (!string.IsNullOrWhiteSpace(token)) Token = token.Trim();
        if (!string.IsNullOrWhiteSpace(platform)) Platform = platform.Trim();
        if (userId.HasValue) UserId = userId;
        IsActive = true;
        LastSeenAt = DateTimeOffset.UtcNow;
    }

    /// <summary>Called when Expo reports the token as no longer deliverable.</summary>
    public void Deactivate() => IsActive = false;
}
