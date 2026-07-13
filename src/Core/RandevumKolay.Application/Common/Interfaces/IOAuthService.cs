namespace RandevumKolay.Application.Common.Interfaces;

public record OAuthUserInfo(
    string Provider,
    string ProviderUserId,
    string Email,
    string FullName,
    string? AvatarUrl);

public interface IOAuthService
{
    Task<OAuthUserInfo> VerifyTokenAsync(string provider, string token);
    string GetAuthorizationUrl(string provider, string redirectUri);
}
