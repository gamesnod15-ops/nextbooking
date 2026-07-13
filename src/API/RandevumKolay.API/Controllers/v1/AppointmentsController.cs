using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Appointments.Commands.CancelAppointment;
using RandevumKolay.Application.Features.Appointments.Commands.ConfirmAppointment;
using RandevumKolay.Application.Features.Appointments.Commands.CompleteAppointment;
using RandevumKolay.Application.Features.Appointments.Commands.CreateAppointment;
using RandevumKolay.Application.Features.Appointments.Queries.GetAppointments;
using RandevumKolay.Application.Features.Appointments.Queries.GetAvailableSlots;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ISender _sender;

    public AppointmentsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateOnly? date = null,
        [FromQuery] Guid? employeeId = null,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetAppointmentsQuery(pageNumber, pageSize, date, employeeId, status, search),
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("available-slots")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] Guid? employeeId,
        [FromQuery] Guid serviceId,
        [FromQuery] DateOnly date,
        [FromQuery] Guid? businessId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetAvailableSlotsQuery(employeeId, serviceId, date, businessId),
            cancellationToken);

        return Ok(result);
    }

    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAppointment(
        [FromBody] CreateAppointmentCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAppointments), new { id }, new { id });
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelAppointment(
        Guid id,
        [FromBody] CancelRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new CancelAppointmentCommand(id, request.Reason), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/confirm")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmAppointment(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new ConfirmAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteAppointment(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new CompleteAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    public record CancelRequest(string Reason);
}
