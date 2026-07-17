using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Admin.Dashboard;
using RandevumKolay.Application.Features.Admin.Feedback;
using RandevumKolay.Application.Features.Admin.Payments;
using RandevumKolay.Application.Features.Admin.Users;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

/// <summary>Platform manager panel — cross-tenant views for the RandevumKolay
/// operations team. Every endpoint here is restricted to the platform_admin
/// role and is not scoped to a single tenant.</summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin")]
[ApiController]
[Authorize(Roles = "platform_admin")]
public class AdminController : ControllerBase
{
    private readonly ISender _sender;

    public AdminController(ISender sender) => _sender = sender;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAdminDashboardQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformUsersQuery(pageNumber, pageSize, search, role, isActive), cancellationToken);
        return Ok(result);
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformUserDetailQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPatch("users/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetUserStatus(
        Guid id,
        [FromBody] SetUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetUserActiveStatusCommand(id, request.IsActive), cancellationToken);
        return NoContent();
    }

    [HttpGet("feedback")]
    public async Task<IActionResult> GetFeedback(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] FeedbackCategory? category = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformFeedbackQuery(pageNumber, pageSize, category), cancellationToken);
        return Ok(result);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] PlatformPaymentType? type = null,
        [FromQuery] PlatformPaymentStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformPaymentsQuery(pageNumber, pageSize, type, status, search), cancellationToken);
        return Ok(result);
    }

    [HttpGet("payments/summary")]
    public async Task<IActionResult> GetPaymentsSummary(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformPaymentsSummaryQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("payments")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePlatformPaymentCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return Created(string.Empty, new { id });
    }

    [HttpPatch("payments/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePaymentStatus(
        Guid id,
        [FromBody] UpdatePaymentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdatePlatformPaymentStatusCommand(id, request.Status), cancellationToken);
        return NoContent();
    }

    public record SetUserStatusRequest(bool IsActive);
    public record UpdatePaymentStatusRequest(PlatformPaymentStatus Status);
}
