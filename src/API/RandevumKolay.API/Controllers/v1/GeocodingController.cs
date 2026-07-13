using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class GeocodingController : ControllerBase
{
    private static readonly HttpClient _http = new()
    {
        Timeout = TimeSpan.FromSeconds(10),
    };

    [HttpGet]
    public async Task<IActionResult> Geocode(
        [FromQuery] string address,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(new { error = "Adres gerekli." });

        var query = Uri.EscapeDataString(address + ", Türkiye");
        var url = $"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&accept-language=tr";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("User-Agent", "RandevumKolay/1.0 (randevumkolay.com)");

        var response = await _http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return StatusCode(502, new { error = "Geocoding servisi erişilemedi." });

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var results = System.Text.Json.JsonSerializer.Deserialize<List<NominatimResult>>(json);

        if (results is null || results.Count == 0)
            return NotFound(new { error = "Adres bulunamadı." });

        var first = results[0];
        return Ok(new { latitude = first.Lat, longitude = first.Lon, displayName = first.DisplayName });
    }

    private class NominatimResult
    {
        [System.Text.Json.Serialization.JsonPropertyName("lat")]
        public double Lat { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("lon")]
        public double Lon { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;
    }
}
