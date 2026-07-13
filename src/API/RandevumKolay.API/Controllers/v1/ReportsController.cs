using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Reports.Queries.GetReports;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ISender _sender;

    public ReportsController(ISender sender) => _sender = sender;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] string? employeeId = null,
        [FromQuery] string? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = startDate ?? now.AddDays(-29);
        var end = endDate ?? now;

        var result = await _sender.Send(
            new GetReportsQuery(start, end, employeeId, serviceId),
            cancellationToken);

        return Ok(result);
    }
}
