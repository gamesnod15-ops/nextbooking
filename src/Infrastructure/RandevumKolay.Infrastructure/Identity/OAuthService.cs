using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace RandevumKolay.Infrastructure.Identity;

public class OAuthService : IOAuthService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OAuthService> _logger;

    public OAuthService(HttpClient httpClient, ILogger<OAuthService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public string GetAuthorizationUrl(string provider, string redirectUri)
    {
        return provider.ToLowerInvariant() switch
        {
            "google" => $"https://accounts.google.com/o/oauth2/v2/auth?client_id={{client_id}}&redirect_uri={redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=online",
            "apple" => $"https://appleid.apple.com/auth/authorize?client_id={{client_id}}&redirect_uri={redirectUri}&response_type=code%20id_token&scope=name%20email",
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
        var response = await _httpClient.GetFromJsonAsync<GoogleTokenPayload>(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

        if (response is null || string.IsNullOrEmpty(response.Sub))
            throw new UnauthorizedAccessException("Invalid Google token.");

        return new OAuthUserInfo(
            "google",
            response.Sub,
            response.Email ?? string.Empty,
            response.Name ?? response.Email ?? "User",
            response.Picture);
    }

    private Task<OAuthUserInfo> VerifyAppleTokenAsync(string idToken)
    {
        var payload = ParseAppleJwtPayload(idToken);

        if (string.IsNullOrEmpty(payload?.Sub))
            throw new UnauthorizedAccessException("Invalid Apple token.");

        return Task.FromResult(new OAuthUserInfo(
            "apple",
            payload.Sub,
            payload.Email ?? string.Empty,
            payload.Name ?? payload.Email ?? "User",
            null));
    }

    private AppleJwtPayload? ParseAppleJwtPayload(string idToken)
    {
        try
        {
            var parts = idToken.Split('.');
            if (parts.Length != 3) return null;

            var payload = parts[1];
            var padding = payload.Length % 4;
            if (padding > 0) payload += new string('=', 4 - padding);
            payload = payload.Replace('-', '+').Replace('_', '/');

            var bytes = Convert.FromBase64String(payload);
            var json = System.Text.Encoding.UTF8.GetString(bytes);
            return System.Text.Json.JsonSerializer.Deserialize<AppleJwtPayload>(json);
        }
        catch
        {
            return null;
        }
    }

    private class GoogleTokenPayload
    {
        [JsonPropertyName("sub")] public string Sub { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("picture")] public string? Picture { get; set; }
    }

    private class AppleJwtPayload
    {
        [JsonPropertyName("sub")] public string Sub { get; set; } = string.Empty;
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
    }
}
