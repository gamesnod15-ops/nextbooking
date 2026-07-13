using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.API.Controllers.v1;
using RandevumKolay.Application.Features.Auth.Commands.CompleteOAuthRegistration;
using RandevumKolay.Application.Features.Auth.Commands.OAuthLogin;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth/oauth")]
[ApiController]
public class OAuthController : ControllerBase
{
    private readonly ISender _sender;

    public OAuthController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("{provider}/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        string provider,
        [FromBody] OAuthCallbackRequest request,
        CancellationToken cancellationToken = default)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _sender.Send(
            new OAuthLoginCommand(provider.ToLowerInvariant(), request.Token, request.DeviceInfo, ip),
            cancellationToken);

        if (result.IsNewUser)
        {
            return Ok(new
            {
                isNewUser = true,
                providerInfo = new
                {
                    result.ProviderInfo!.Provider,
                    result.ProviderInfo.ProviderUserId,
                    result.ProviderInfo.Email,
                    result.ProviderInfo.FullName,
                    result.ProviderInfo.AvatarUrl
                }
            });
        }

        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new
        {
            isNewUser = false,
            result.AccessToken,
            result.UserId,
            result.Role,
            result.FullName,
            result.Email,
            result.AvatarUrl,
            result.TenantId
        });
    }

    [HttpPost("complete-registration")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteRegistration(
        [FromBody] CompleteOAuthRegistrationCommand command,
        CancellationToken cancellationToken = default)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _sender.Send(
            command with { IpAddress = ip },
            cancellationToken);

        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new
        {
            result.AccessToken,
            result.UserId,
            result.Role,
            result.FullName,
            result.TenantId
        });
    }
}

public record OAuthCallbackRequest(string Token, string? DeviceInfo = null);
