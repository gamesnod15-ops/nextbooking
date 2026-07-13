using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Auth.Commands.ChangePassword;
using RandevumKolay.Application.Features.Auth.Commands.ForgotPassword;
using RandevumKolay.Application.Features.Auth.Commands.Login;
using RandevumKolay.Application.Features.Auth.Commands.RefreshToken;
using RandevumKolay.Application.Features.Auth.Commands.RegisterCustomer;
using RandevumKolay.Application.Features.Auth.Commands.ResetPassword;
using RandevumKolay.Application.Features.Auth.Commands.SendPhoneOtp;
using RandevumKolay.Application.Features.Auth.Commands.UpdateEmail;
using RandevumKolay.Application.Features.Auth.Commands.VerifyEmail;
using RandevumKolay.Application.Features.Auth.Commands.VerifyPhoneOtp;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _sender.Send(
            command with { IpAddress = ip },
            cancellationToken);

        // Set refresh token as HttpOnly cookie
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
            result.RefreshToken,
            result.Role,
            result.UserId,
            result.FullName,
            result.TenantId,
            result.EmailVerified,
            result.PhoneVerified
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest? body = null,
        CancellationToken cancellationToken = default)
    {
        var refreshToken = body?.RefreshToken ?? Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized(new { error = "Refresh token not found." });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _sender.Send(
            new RefreshTokenCommand(refreshToken, ip),
            cancellationToken);

        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new { result.AccessToken });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordCommand command,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("update-email")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateEmail(
        [FromBody] UpdateEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateEmailCommand(request.NewEmail), cancellationToken);
        return NoContent();
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new VerifyEmailCommand(request.Token), cancellationToken);
        return Ok(new { message = "E-posta başarıyla doğrulandı." });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ForgotPasswordCommand(request.Email), cancellationToken);
        return Ok(new { message = "Sifre sifirlama baglantisi e-posta adresinize gonderildi." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ResetPasswordCommand(request.Token, request.NewPassword), cancellationToken);
        return Ok(new { message = "Sifreniz basariyla sifirlandi." });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterCustomer(
        [FromBody] RegisterCustomerCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(RegisterCustomer), result);
    }

    [HttpPost("send-phone-otp")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendPhoneOtp(
        [FromBody] SendPhoneOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SendPhoneOtpCommand(request.Phone), cancellationToken);
        return NoContent();
    }

    [HttpPost("verify-phone-otp")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyPhoneOtp(
        [FromBody] VerifyPhoneOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new VerifyPhoneOtpCommand(request.Phone, request.Otp), cancellationToken);
        return Ok(new { message = "Telefon numarası başarıyla doğrulandı." });
    }
}

public record VerifyEmailRequest(string Token);
public record UpdateEmailRequest(string NewEmail);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record RefreshTokenRequest(string? RefreshToken);
public record SendPhoneOtpRequest(string Phone);
public record VerifyPhoneOtpRequest(string Phone, string Otp);
