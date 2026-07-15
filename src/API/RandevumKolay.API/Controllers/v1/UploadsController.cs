using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Users.Commands.UploadAvatar;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class UploadsController : ControllerBase
{
    private readonly ISender _sender;

    public UploadsController(ISender sender) => _sender = sender;

    [HttpPost("image")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadImage(
        IFormFile file,
        [FromQuery] string? folder = null,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest("File is required.");

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest("Only image files are allowed.");

        var subFolder = string.IsNullOrWhiteSpace(folder) ? "general" : folder;
        var uploadsDir = Path.Combine(
            Environment.GetEnvironmentVariable("UPLOADS_DIR")
                ?? Path.Combine(AppContext.BaseDirectory, "wwwroot"),
            "uploads", subFolder);
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var baseUrl = Environment.GetEnvironmentVariable("BASE_URL")
            ?? "https://api-randevumkolay.azurewebsites.net";
        var url = $"{baseUrl}/uploads/{subFolder}/{fileName}";

        return Ok(new { url });
    }
}
