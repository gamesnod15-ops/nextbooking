using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Admin.Customers;
using RandevumKolay.Application.Features.Admin.Dashboard;
using RandevumKolay.Application.Features.Admin.Employees;
using RandevumKolay.Application.Features.Admin.Feedback;
using RandevumKolay.Application.Features.Admin.Payments;
using RandevumKolay.Application.Features.Admin.PricingPlans;
using RandevumKolay.Application.Features.Admin.Tenants;
using RandevumKolay.Application.Features.Admin.Users;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

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

    // "users" here means platform_admin accounts specifically — business owners,
    // staff and customers are covered by /admin/tenants, /admin/employees and
    // /admin/customers instead.
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformUsersQuery(pageNumber, pageSize, search, "platform_admin", null), cancellationToken);
        return Ok(result);
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformUserDetailQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("users")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAdmin(
        [FromBody] CreatePlatformAdminCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return Created(string.Empty, new { id });
    }

    [HttpPut("users/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateAdmin(
        Guid id,
        [FromBody] UpdateAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(
            new UpdatePlatformAdminCommand(id, request.FirstName, request.LastName, request.Email, request.Phone),
            cancellationToken);
        return NoContent();
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

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? plan = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] BusinessCategory? category = null,
        [FromQuery] string? city = null,
        [FromQuery] PlatformTenantSort sort = PlatformTenantSort.Recent,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetPlatformTenantsQuery(pageNumber, pageSize, search, plan, isActive, category, city, sort), cancellationToken);
        return Ok(result);
    }

    [HttpPatch("tenants/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetTenantStatus(
        Guid id,
        [FromBody] SetUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetTenantActiveStatusCommand(id, request.IsActive), cancellationToken);
        return NoContent();
    }

    [HttpDelete("tenants/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTenant(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteTenantCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] bool? isBlocked = null,
        [FromQuery] int? minTotalVisits = null,
        [FromQuery] PlatformCustomerSort sort = PlatformCustomerSort.Recent,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetPlatformCustomersQuery(pageNumber, pageSize, search, tenantId, isBlocked, minTotalVisits, sort), cancellationToken);
        return Ok(result);
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPlatformEmployeesQuery(pageNumber, pageSize, search, tenantId, isActive), cancellationToken);
        return Ok(result);
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

    [HttpPost("payments/sync-subscriptions")]
    public async Task<IActionResult> SyncSubscriptionPayments(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SyncSubscriptionPaymentsCommand(), cancellationToken);
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

    [HttpGet("pricing-plans")]
    public async Task<IActionResult> GetPricingPlans(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPricingPlansQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("pricing-plans")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePricingPlan(
        [FromBody] CreatePricingPlanCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return Created(string.Empty, new { id });
    }

    [HttpPut("pricing-plans/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePricingPlan(
        Guid id,
        [FromBody] UpdatePricingPlanRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(
            new UpdatePricingPlanCommand(
                id, request.Name, request.BadgeLabel, request.Description, request.Price, request.IsCustomPricing,
                request.ButtonText, request.Features, request.IsHighlighted, request.HighlightLabel, request.PlanKey),
            cancellationToken);
        return NoContent();
    }

    [HttpPatch("pricing-plans/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetPricingPlanStatus(
        Guid id,
        [FromBody] SetUserStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetPricingPlanActiveCommand(id, request.IsActive), cancellationToken);
        return NoContent();
    }

    [HttpDelete("pricing-plans/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeletePricingPlan(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeletePricingPlanCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("pricing-plan-slots")]
    public async Task<IActionResult> GetPricingPlanSlots(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPricingPlanSlotsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("pricing-plan-slots/{slotNumber:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SetPricingPlanSlot(
        int slotNumber,
        [FromBody] SetPricingPlanSlotRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new SetPricingPlanSlotCommand(slotNumber, request.PricingPlanId), cancellationToken);
        return NoContent();
    }

    public record SetUserStatusRequest(bool IsActive);
    public record UpdatePaymentStatusRequest(PlatformPaymentStatus Status);
    public record UpdateAdminRequest(string FirstName, string LastName, string Email, string? Phone);

    public record UpdatePricingPlanRequest(
        string Name,
        string BadgeLabel,
        string Description,
        decimal? Price,
        bool IsCustomPricing,
        string ButtonText,
        List<string> Features,
        bool IsHighlighted,
        string? HighlightLabel,
        string? PlanKey);

    public record SetPricingPlanSlotRequest(Guid? PricingPlanId);
}
