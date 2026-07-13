using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Services.Commands.CreateService;
using RandevumKolay.Application.Features.Services.Commands.DeleteService;
using RandevumKolay.Application.Features.Services.Commands.UpdateService;
using RandevumKolay.Application.Features.Services.Queries.GetServices;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly ISender _sender;

    public ServicesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetServices(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetServicesQuery(pageNumber, pageSize, search, isActive), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateService(
        [FromBody] CreateServiceCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetServices), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateService(
        Guid id,
        [FromBody] UpdateServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateServiceCommand(
            id, request.Name, request.Description, request.DurationMinutes,
            request.Price, request.BufferMinutes, request.RequiresConfirmation,
            request.IsActive, request.Color, request.ImageUrl), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteService(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteServiceCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateServiceRequest(
        string Name,
        string? Description,
        int DurationMinutes,
        decimal Price,
        int BufferMinutes,
        bool RequiresConfirmation,
        bool IsActive,
        string? Color,
        string? ImageUrl);
}
