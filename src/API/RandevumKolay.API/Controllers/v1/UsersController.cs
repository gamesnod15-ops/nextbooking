using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Users.Commands.DeleteAccount;
using RandevumKolay.Application.Features.Users.Commands.UpdateProfile;
using RandevumKolay.Application.Features.Users.Commands.UploadAvatar;
using RandevumKolay.Application.Features.Users.Queries.GetProfile;
using RandevumKolay.Application.Features.Users.Queries.GetUserDashboard;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ISender _sender;

    public UsersController(ISender sender) => _sender = sender;

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetProfileQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetUserDashboardQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("me/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadAvatar(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest("File is required.");

        await using var stream = file.OpenReadStream();
        var url = await _sender.Send(
            new UploadAvatarCommand(file.FileName, stream), cancellationToken);
        return Ok(new { url });
    }

    [HttpDelete("me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAccount(
        [FromBody] DeleteAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteAccountCommand(request.Password), cancellationToken);
        return NoContent();
    }
}

public record DeleteAccountRequest(string Password);
