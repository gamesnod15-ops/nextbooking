using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Performance;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class PerformanceController : ControllerBase
{
    private readonly ISender _sender;
    public PerformanceController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPerformance(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? periodStart = null, [FromQuery] string? periodEnd = null,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(
            new GetEmployeePerformanceQuery(pageNumber, pageSize, periodStart, periodEnd), ct);
        return Ok(result);
    }
}
