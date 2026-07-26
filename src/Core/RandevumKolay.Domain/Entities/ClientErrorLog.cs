using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// A crash/error reported by a mobile client, so failures in the field are
/// visible without a third-party crash reporter.
/// </summary>
public class ClientErrorLog : BaseEntity
{
    public string Message { get; private set; } = string.Empty;
    public string? Stack { get; private set; }
    public string? ComponentStack { get; private set; }
    public string? Scope { get; private set; }
    public string Platform { get; private set; } = "unknown";
    public string? OsVersion { get; private set; }
    public string? AppVersion { get; private set; }
    public string? AppEnv { get; private set; }
    public string? DeviceId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClientErrorLog() { }

    public static ClientErrorLog Create(
        string message,
        string? stack,
        string? componentStack,
        string? scope,
        string platform,
        string? osVersion,
        string? appVersion,
        string? appEnv,
        string? deviceId)
    {
        return new ClientErrorLog
        {
            Message = string.IsNullOrWhiteSpace(message) ? "unknown" : Truncate(message, 500),
            Stack = Truncate(stack, 4000),
            ComponentStack = Truncate(componentStack, 2000),
            Scope = Truncate(scope, 100),
            Platform = string.IsNullOrWhiteSpace(platform) ? "unknown" : Truncate(platform, 32)!,
            OsVersion = Truncate(osVersion, 32),
            AppVersion = Truncate(appVersion, 32),
            AppEnv = Truncate(appEnv, 32),
            DeviceId = Truncate(deviceId, 64),
        };
    }

    private static string? Truncate(string? value, int max)
        => string.IsNullOrEmpty(value) ? value : (value.Length <= max ? value : value[..max]);
}
