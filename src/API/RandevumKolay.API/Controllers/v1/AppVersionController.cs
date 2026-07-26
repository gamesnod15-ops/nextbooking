using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/app-version")]
[ApiController]
public class AppVersionController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AppVersionController(IConfiguration configuration) => _configuration = configuration;

    /// <summary>
    /// The oldest mobile build still allowed to run. Raise
    /// MobileApp:MinimumVersion in configuration to force an update;
    /// the client fails open if this call does not succeed.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Get([FromQuery] string? platform)
    {
        var minimumVersion = _configuration["MobileApp:MinimumVersion"] ?? "1.0.0";

        var storeUrl = platform?.ToLowerInvariant() switch
        {
            "ios" => _configuration["MobileApp:IosStoreUrl"],
            "android" => _configuration["MobileApp:AndroidStoreUrl"],
            _ => null,
        };

        return Ok(new
        {
            minimumVersion,
            storeUrl,
            platform = platform ?? "unknown",
        });
    }
}
