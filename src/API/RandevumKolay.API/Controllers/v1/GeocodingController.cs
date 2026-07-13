using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class GeocodingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GeocodingController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> Geocode(
        [FromQuery] string address,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(new { error = "Adres gerekli." });

        try
        {
            var parts = address.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length == 0)
                return BadRequest(new { error = "Adres gerekli." });

            var client = _httpClientFactory.CreateClient();

            // Try progressively simpler queries: full address, without street, just city
            var attempts = new List<string>();
            if (parts.Length >= 3)
            {
                // Try: neighborhood + city (skip street details)
                attempts.Add(string.Join(", ", parts[0], parts[^1]) + ", Türkiye");
                // Try: full address
                attempts.Add(address + ", Türkiye");
            }
            else
            {
                attempts.Add(address + ", Türkiye");
            }

            foreach (var attempt in attempts)
            {
                var query = Uri.EscapeDataString(attempt);
                var url = $"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&accept-language=tr";

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.TryAddWithoutValidation("User-Agent", "RandevumKolay/1.0 (https://randevumkolay.com; info@randevumkolay.com)");

                var response = await client.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                    continue;

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var results = System.Text.Json.JsonSerializer.Deserialize<List<NominatimResult>>(json);

                if (results is not null && results.Count > 0)
                {
                    var first = results[0];
                    if (double.TryParse(first.Lat, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                        double.TryParse(first.Lon, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                    {
                        return Ok(new { latitude = lat, longitude = lon, displayName = first.DisplayName });
                    }
                }

                // Respect Nominatim rate limit (1 req/sec)
                await Task.Delay(1100, cancellationToken);
            }

            // Final attempt: try just the last part (city)
            var cityAttempt = parts[^1].Trim() + ", Türkiye";
            var cityQuery = Uri.EscapeDataString(cityAttempt);
            var cityUrl = $"https://nominatim.openstreetmap.org/search?q={cityQuery}&format=json&limit=1&accept-language=tr";
            using var cityRequest = new HttpRequestMessage(HttpMethod.Get, cityUrl);
            cityRequest.Headers.TryAddWithoutValidation("User-Agent", "RandevumKolay/1.0 (https://randevumkolay.com; info@randevumkolay.com)");
            var cityResponse = await client.SendAsync(cityRequest, cancellationToken);
            if (cityResponse.IsSuccessStatusCode)
            {
                var cityJson = await cityResponse.Content.ReadAsStringAsync(cancellationToken);
                var cityResults = System.Text.Json.JsonSerializer.Deserialize<List<NominatimResult>>(cityJson);
                if (cityResults is not null && cityResults.Count > 0)
                {
                    var first = cityResults[0];
                    if (double.TryParse(first.Lat, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                        double.TryParse(first.Lon, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                    {
                        return Ok(new { latitude = lat, longitude = lon, displayName = first.DisplayName });
                    }
                }
            }

            return NotFound(new { error = "Adres bulunamadı." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "Geocoding hatası: " + ex.Message });
        }
    }

    private class NominatimResult
    {
        [System.Text.Json.Serialization.JsonPropertyName("lat")]
        public string Lat { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("lon")]
        public string Lon { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;
    }
}
