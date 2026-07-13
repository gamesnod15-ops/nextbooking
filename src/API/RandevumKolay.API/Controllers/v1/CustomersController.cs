using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Customers.Commands.CreateCustomer;
using RandevumKolay.Application.Features.Customers.Commands.DeleteCustomer;
using RandevumKolay.Application.Features.Customers.Commands.UpdateCustomer;
using RandevumKolay.Application.Features.Customers.Queries.GetCustomers;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ISender _sender;

    public CustomersController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isBlocked = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetCustomersQuery(pageNumber, pageSize, search, isBlocked), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCustomer(
        [FromBody] CreateCustomerCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCustomers), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateCustomer(
        Guid id,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateCustomerCommand(
            id, request.Name, request.Phone, request.Email,
            request.Notes, request.BirthDate, request.IsBlocked), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCustomer(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteCustomerCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateCustomerRequest(
        string Name,
        string Phone,
        string? Email,
        string? Notes,
        DateOnly? BirthDate,
        bool IsBlocked);
}
