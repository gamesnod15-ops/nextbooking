using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.GiftCoupons.Commands.CreateGiftCoupon;
using RandevumKolay.Application.Features.GiftCoupons.Commands.DeleteGiftCoupon;
using RandevumKolay.Application.Features.GiftCoupons.Commands.UpdateGiftCoupon;
using RandevumKolay.Application.Features.GiftCoupons.Queries.GetGiftCoupons;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class GiftCouponsController : ControllerBase
{
    private readonly ISender _sender;

    public GiftCouponsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetGiftCoupons(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] GiftCouponStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetGiftCouponsQuery(pageNumber, pageSize, status, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateGiftCoupon(
        [FromBody] CreateGiftCouponCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetGiftCoupons), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateGiftCoupon(
        Guid id,
        [FromBody] UpdateGiftCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateGiftCouponCommand(
            id, request.RecipientName, request.RecipientEmail,
            request.PurchasedBy, request.ExpiryDate, request.Message), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteGiftCoupon(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteGiftCouponCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateGiftCouponRequest(
        string RecipientName,
        string? RecipientEmail,
        string PurchasedBy,
        DateTimeOffset? ExpiryDate,
        string? Message);
}
