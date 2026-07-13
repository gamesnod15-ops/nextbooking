namespace RandevumKolay.Domain.Enums;

public static class AuthProviders
{
    public const string Google = "google";
    public const string Apple = "apple";

    public static readonly string[] All = [Google, Apple];

    public static bool IsValid(string provider)
        => All.Contains(provider);
}
