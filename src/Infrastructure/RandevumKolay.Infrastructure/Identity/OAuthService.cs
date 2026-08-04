using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RandevumKolay.Application.Common.Interfaces;
using System.IdentityModel.Tokens.Jwt;
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
        if (string.IsNullOrWhiteSpace(_settings.Google.ClientId))
        {
            _logger.LogError("Google OAuth is not configured (OAuth:Google:ClientId is empty).");
            throw new UnauthorizedAccessException("Google OAuth is not configured.");
        }

        var response = await _httpClient.GetFromJsonAsync<GoogleTokenPayload>(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

        if (response is null || string.IsNullOrEmpty(response.Sub))
            throw new UnauthorizedAccessException("Invalid Google token.");

        // `tokeninfo` verifies the token's signature/expiry, but not that it was
        // issued *for this app* — an id_token minted for a different Google
        // client would otherwise still pass. Checking `aud` closes that gap.
        if (response.Aud != _settings.Google.ClientId)
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
        if (string.IsNullOrWhiteSpace(_settings.Apple.ClientId))
        {
            _logger.LogError("Apple OAuth is not configured (OAuth:Apple:ClientId is empty).");
            throw new UnauthorizedAccessException("Apple OAuth is not configured.");
        }

        var jwks = await GetAppleJwksAsync();
        var handler = new JwtSecurityTokenHandler();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = AppleIssuer,
            ValidateAudience = true,
            ValidAudience = _settings.Apple.ClientId,
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
    public string ClientId { get; set; } = string.Empty;
}

public class AppleOAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
}
