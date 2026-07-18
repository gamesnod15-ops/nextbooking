using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.PricingPlans;

namespace RandevumKolay.API.Controllers.v1;

/// <summary>Public pricing-page data, sourced from the manager panel's
/// pricing plan slots. No authentication required — consumed by the
/// marketing site and business panel upgrade prompts.</summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/pricing-plans")]
[ApiController]
[AllowAnonymous]
public class PricingPlansController : ControllerBase
{
    private readonly ISender _sender;

    public PricingPlansController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPublicPricingPlansQuery(), cancellationToken);
        return Ok(result);
    }
}
