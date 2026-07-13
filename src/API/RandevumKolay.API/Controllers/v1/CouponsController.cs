using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Coupons.Queries.GetCoupons;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class CouponsController : ControllerBase
{
    private readonly ISender _sender;

    public CouponsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetCoupons(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetCouponsQuery(pageNumber, pageSize, isActive, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCoupon(
        [FromBody] CreateCouponCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCoupons), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateCoupon(
        Guid id,
        [FromBody] UpdateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateCouponCommand(
            id, request.Code, request.Description, request.DiscountType,
            request.DiscountValue, request.MinimumOrderAmount, request.ExpiresAt,
            request.UsageLimit, request.IsActive), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCoupon(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteCouponCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateCouponRequest(
        string Code,
        string? Description,
        DiscountType DiscountType,
        decimal DiscountValue,
        decimal? MinimumOrderAmount,
        DateTimeOffset? ExpiresAt,
        int? UsageLimit,
        bool IsActive);
}
