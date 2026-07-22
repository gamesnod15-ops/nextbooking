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
        [FromQuery] string? categoryIds,
        [FromQuery] string? city,
        [FromQuery] string? cities,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var parsedCategoryIds = new List<int>();
        if (categoryId.HasValue)
            parsedCategoryIds.Add(categoryId.Value);
        else if (!string.IsNullOrWhiteSpace(categoryIds))
            parsedCategoryIds = categoryIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();

        var parsedCities = new List<string>();
        if (!string.IsNullOrWhiteSpace(city))
            parsedCities.Add(city);
        else if (!string.IsNullOrWhiteSpace(cities))
            parsedCities = cities.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrEmpty(s))
                .ToList();

        var result = await _sender.Send(
            new GetPublicBusinessesQuery(search, parsedCategoryIds, parsedCities, pageNumber, pageSize),
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
