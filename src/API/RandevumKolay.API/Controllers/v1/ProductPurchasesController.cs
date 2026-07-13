using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.ProductPurchases;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/product-purchases")]
[ApiController]
[Authorize]
public class ProductPurchasesController : ControllerBase
{
    private readonly ISender _sender;

    public ProductPurchasesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetPurchases(CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetProductPurchasesQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Purchase([FromBody] PurchaseProductCommand command, CancellationToken ct = default)
    {
        var result = await _sender.Send(command, ct);
        return Ok(result);
    }
}
