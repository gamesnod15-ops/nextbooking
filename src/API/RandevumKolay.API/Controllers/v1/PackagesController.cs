using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Packages;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class PackagesController : ControllerBase
{
    private readonly ISender _sender;

    public PackagesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPackages(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPackagesQuery(pageNumber, pageSize, isActive, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePackage(
        [FromBody] CreatePackageCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetPackages), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePackage(
        Guid id,
        [FromBody] UpdatePackageRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdatePackageCommand(
            id, request.Name, request.Description, request.Price, request.OriginalPrice,
            request.ValidityDays, request.IsActive, request.ImageUrl, request.Items), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeletePackage(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeletePackageCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdatePackageRequest(
        string Name,
        string? Description,
        decimal Price,
        decimal? OriginalPrice,
        int ValidityDays,
        bool IsActive,
        string? ImageUrl,
        List<PackageItemInput>? Items);
}
