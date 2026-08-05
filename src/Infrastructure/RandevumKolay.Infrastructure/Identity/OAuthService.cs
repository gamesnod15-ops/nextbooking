using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RandevumKolay.Application.Common.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace RandevumKolay.Infrastructure.Identity;

public class OAuthService : IOAuthService
{
    private const string AppleJwksUrl = "https://appleid.apple.com/auth/keys";
    private const string AppleIssuer = "https://appleid.apple.com";
    private static readonly TimeSpan AppleJwksCacheDuration = TimeSpan.FromHours(24);

    private static JsonWebKeySet? _cachedAppleJwks;
    private static DateTime _appleJwksCachedAtUtc = DateTime.MinValue;
    private static readonly SemaphoreSlim _appleJwksLock = new(1, 1);

    private readonly HttpClient _httpClient;
    private readonly OAuthSettings _settings;
    private readonly ILogger<OAuthService> _logger;

    public OAuthService(HttpClient httpClient, IOptions<OAuthSettings> settings, ILogger<OAuthService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public string GetAuthorizationUrl(string provider, string redirectUri)
    {
        return provider.ToLowerInvariant() switch
        {
            "google" => $"https://accounts.google.com/o/oauth2/v2/auth?client_id={_settings.Google.ClientId}&redirect_uri={redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=online",
            "apple" => $"https://appleid.apple.com/auth/authorize?client_id={_settings.Apple.ClientId}&redirect_uri={redirectUri}&response_type=code%20id_token&scope=name%20email",
            _ => throw new ArgumentException($"Unsupported provider: {provider}")
        };
    }

    public async Task<OAuthUserInfo> VerifyTokenAsync(string provider, string token)
    {
        return provider.ToLowerInvariant() switch
        {
            "google" => await VerifyGoogleTokenAsync(token),
            "apple" => await VerifyAppleTokenAsync(token),
            _ => throw new ArgumentException($"Unsupported provider: {provider}")
        };
    }

    private async Task<OAuthUserInfo> VerifyGoogleTokenAsync(string idToken)
    {
        // The web app, business-panel, and the mobile app each authenticate
        // against a *different* Google OAuth client (a "Web application"
        // client can't use a native `jetrandevu://` redirect, so iOS/Android
        // each need their own client) — any of them is a legitimate audience.
        var validAudiences = new[] { _settings.Google.ClientId, _settings.Google.IosClientId, _settings.Google.AndroidClientId }
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToArray();

        if (validAudiences.Length == 0)
        {
            _logger.LogError("Google OAuth is not configured (no OAuth:Google client ID is set).");
            throw new UnauthorizedAccessException("Google OAuth is not configured.");
        }

        var response = await _httpClient.GetFromJsonAsync<GoogleTokenPayload>(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

        if (response is null || string.IsNullOrEmpty(response.Sub))
            throw new UnauthorizedAccessException("Invalid Google token.");

        // `tokeninfo` verifies the token's signature/expiry, but not that it was
        // issued *for this app* — an id_token minted for a different Google
        // client would otherwise still pass. Checking `aud` closes that gap.
        if (!validAudiences.Contains(response.Aud))
            throw new UnauthorizedAccessException("Google token was not issued for this application.");

        return new OAuthUserInfo(
            "google",
            response.Sub,
            response.Email ?? string.Empty,
            response.Name ?? response.Email ?? "User",
            response.Picture);
    }

    private async Task<OAuthUserInfo> VerifyAppleTokenAsync(string idToken)
    {
        // Native Sign In with Apple (expo-apple-authentication on mobile) mints
        // an id_token whose `aud` is the app's *bundle ID*, not the Services ID
        // used for the web flow — both are legitimate audiences for us.
        var validAudiences = new[] { _settings.Apple.ClientId, _settings.Apple.BundleId }
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToArray();

        if (validAudiences.Length == 0)
        {
            _logger.LogError("Apple OAuth is not configured (no OAuth:Apple client ID is set).");
            throw new UnauthorizedAccessException("Apple OAuth is not configured.");
        }

        var jwks = await GetAppleJwksAsync();
        var handler = new JwtSecurityTokenHandler();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = AppleIssuer,
            ValidateAudience = true,
            ValidAudiences = validAudiences,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = jwks.Keys,
            ClockSkew = TimeSpan.FromMinutes(2),
        };

        System.Security.Claims.ClaimsPrincipal principal;
        try
        {
            principal = handler.ValidateToken(idToken, validationParameters, out _);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Apple id_token failed signature/claims validation.");
            throw new UnauthorizedAccessException("Invalid Apple token.");
        }

        var sub = principal.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(sub))
            throw new UnauthorizedAccessException("Invalid Apple token.");

        var email = principal.FindFirst("email")?.Value;

        // Apple only ever sends the user's name once, in the initial form-post
        // body (not inside the id_token) — the frontend forwards it separately
        // when present. There's nothing to recover from the token itself here.
        return new OAuthUserInfo("apple", sub, email ?? string.Empty, email ?? "User", null);
    }

    /// <summary>
    /// Apple's signing keys rotate infrequently; caching for a day avoids
    /// hitting their JWKS endpoint on every single login.
    /// </summary>
    private async Task<JsonWebKeySet> GetAppleJwksAsync()
    {
        if (_cachedAppleJwks is not null && DateTime.UtcNow - _appleJwksCachedAtUtc < AppleJwksCacheDuration)
            return _cachedAppleJwks;

        await _appleJwksLock.WaitAsync();
        try
        {
            if (_cachedAppleJwks is not null && DateTime.UtcNow - _appleJwksCachedAtUtc < AppleJwksCacheDuration)
                return _cachedAppleJwks;

            var json = await _httpClient.GetStringAsync(AppleJwksUrl);
            _cachedAppleJwks = new JsonWebKeySet(json);
            _appleJwksCachedAtUtc = DateTime.UtcNow;
            return _cachedAppleJwks;
        }
        finally
        {
            _appleJwksLock.Release();
        }
    }

    private class GoogleTokenPayload
    {
        [JsonPropertyName("sub")] public string Sub { get; set; } = string.Empty;
        [JsonPropertyName("aud")] public string? Aud { get; set; }
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("picture")] public string? Picture { get; set; }
    }
}

public class OAuthSettings
{
    public GoogleOAuthSettings Google { get; set; } = new();
    public AppleOAuthSettings Apple { get; set; } = new();
}

public class GoogleOAuthSettings
{
    /// <summary>The "Web application" client shared by the web app and business-panel.</summary>
    public string ClientId { get; set; } = string.Empty;
    /// <summary>The "iOS" client tied to the mobile app's bundle ID (com.jetrandevu.app).</summary>
    public string IosClientId { get; set; } = string.Empty;
    /// <summary>The "Android" client tied to the mobile app's package name + signing SHA-1.</summary>
    public string AndroidClientId { get; set; } = string.Empty;
}

public class AppleOAuthSettings
{
    /// <summary>The Services ID used by the web/business-panel Sign In with Apple flow.</summary>
    public string ClientId { get; set; } = string.Empty;
    /// <summary>The app's bundle ID (com.jetrandevu.app) — the audience native Sign In with Apple tokens carry.</summary>
    public string BundleId { get; set; } = string.Empty;
}
