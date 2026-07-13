using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Reviews.Commands.CreateReview;
using RandevumKolay.Application.Features.Reviews.Queries.GetBusinessReviews;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly ISender _sender;

    public ReviewsController(ISender sender) => _sender = sender;

    [HttpGet("{businessId:guid}")]
    public async Task<IActionResult> GetReviews(Guid businessId, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetBusinessReviewsQuery(businessId), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewCommand command, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
