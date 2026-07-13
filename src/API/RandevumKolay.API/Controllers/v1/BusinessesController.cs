using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Business.Queries.GetPublicBusiness;
using RandevumKolay.Application.Features.Business.Queries.GetPublicBusinesses;
using RandevumKolay.Application.Features.Businesses.Queries.GetBusinessCalendarAvailability;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class BusinessesController : ControllerBase
{
    private readonly ISender _sender;

    public BusinessesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetBusinesses(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] string? city,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetPublicBusinessesQuery(search, categoryId, city, pageNumber, pageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBusiness(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPublicBusinessQuery(id), cancellationToken);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{id:guid}/availability")]
    public async Task<IActionResult> GetCalendarAvailability(
        Guid id,
        [FromQuery] Guid serviceId,
        [FromQuery] int month,
        [FromQuery] int year,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetBusinessCalendarAvailabilityQuery(id, serviceId, month, year),
            cancellationToken);
        return Ok(result);
    }
}
