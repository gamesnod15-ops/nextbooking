using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Employees.Commands.CreateEmployee;
using RandevumKolay.Application.Features.Employees.Commands.DeleteEmployee;
using RandevumKolay.Application.Features.Employees.Commands.UpdateEmployee;
using RandevumKolay.Application.Features.Employees.Commands.UpsertSchedules;
using RandevumKolay.Application.Features.Employees.Queries.GetEmployeeSchedules;
using RandevumKolay.Application.Features.Employees.Queries.GetEmployees;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly ISender _sender;

    public EmployeesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetEmployeesQuery(pageNumber, pageSize, search, isActive), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateEmployee(
        [FromBody] CreateEmployeeCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetEmployees), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateEmployee(
        Guid id,
        [FromBody] UpdateEmployeeRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateEmployeeCommand(
            id, request.Name, request.Title, request.Bio, request.Phone,
            request.Email, request.IsActive, request.AcceptsOnlineBookings, request.ServiceIds), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteEmployee(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteEmployeeCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/schedules")]
    public async Task<IActionResult> GetSchedules(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetEmployeeSchedulesQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/schedules")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpsertSchedules(
        Guid id,
        [FromBody] List<ScheduleEntry> schedules,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpsertSchedulesCommand(id, schedules), cancellationToken);
        return NoContent();
    }

    public record UpdateEmployeeRequest(
        string Name,
        string? Title,
        string? Bio,
        string? Phone,
        string? Email,
        bool IsActive,
        bool AcceptsOnlineBookings,
        List<Guid>? ServiceIds);
}
