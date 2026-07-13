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
            var client = _httpClientFactory.CreateClient();
            var query = Uri.EscapeDataString(address + ", Türkiye");
            var url = $"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&accept-language=tr";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("User-Agent", "RandevumKolay/1.0 (https://randevumkolay.com; info@randevumkolay.com)");

            var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return StatusCode(502, new { error = "Geocoding servisi erişilemedi." });

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var results = System.Text.Json.JsonSerializer.Deserialize<List<NominatimResult>>(json);

            if (results is null || results.Count == 0)
                return NotFound(new { error = "Adres bulunamadı." });

            var first = results[0];
            if (double.TryParse(first.Lat, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                double.TryParse(first.Lon, System.Globalization.CultureInfo.InvariantCulture, out var lon))
            {
                return Ok(new { latitude = lat, longitude = lon, displayName = first.DisplayName });
            }
            return StatusCode(502, new { error = "Koordinatlar ayrıştırılamadı." });
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
