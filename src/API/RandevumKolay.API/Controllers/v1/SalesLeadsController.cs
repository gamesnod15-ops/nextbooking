using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.SalesLeads;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sales-leads")]
[ApiController]
public class SalesLeadsController : ControllerBase
{
    private readonly ISender _sender;
    public SalesLeadsController(ISender sender) => _sender = sender;

    /// <summary>"Satış Ekibiyle Görüş" (Kurumsal plan) form submission. Public —
    /// the requester may not have an account yet.</summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLead(
        [FromBody] CreateSalesLeadCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return Created(string.Empty, new { id });
    }
}
