using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Favorites;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly ISender _sender;

    public FavoritesController(ISender sender) => _sender = sender;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyFavorites(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetMyFavoritesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{businessId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AddFavorite(Guid businessId, CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(new AddFavoriteCommand(businessId), cancellationToken);
        return Ok(new { id });
    }

    [HttpDelete("{businessId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFavorite(Guid businessId, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new RemoveFavoriteCommand(businessId), cancellationToken);
        return NoContent();
    }
}
