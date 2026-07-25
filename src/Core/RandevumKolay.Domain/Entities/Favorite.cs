using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Favorite : BaseEntity
{
    public Guid? UserId { get; private set; }
    public string? DeviceId { get; private set; }
    public Guid BusinessId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public Business? Business { get; private set; }

    private Favorite() { }

    public static Favorite CreateForUser(Guid userId, Guid businessId)
    {
        return new Favorite
        {
            UserId = userId,
            BusinessId = businessId,
        };
    }

    public static Favorite CreateForDevice(string deviceId, Guid businessId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deviceId);

        return new Favorite
        {
            DeviceId = deviceId,
            BusinessId = businessId,
        };
    }
}
