using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Campaigns.Commands.CreateCampaign;
using RandevumKolay.Application.Features.Campaigns.Commands.DeleteCampaign;
using RandevumKolay.Application.Features.Campaigns.Commands.UpdateCampaign;
using RandevumKolay.Application.Features.Campaigns.Queries.GetCampaigns;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class CampaignsController : ControllerBase
{
    private readonly ISender _sender;

    public CampaignsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetCampaigns(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] CampaignStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetCampaignsQuery(pageNumber, pageSize, status, search), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCampaign(
        [FromBody] CreateCampaignCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCampaigns), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateCampaign(
        Guid id,
        [FromBody] UpdateCampaignRequest request,
        CancellationToken cancellationToken = default)
    {
        await _sender.Send(new UpdateCampaignCommand(
            id, request.Name, request.Description, request.DiscountType,
            request.DiscountValue, request.StartDate, request.EndDate,
            request.Status, request.UsageLimit, request.ApplicableServiceIds), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCampaign(Guid id, CancellationToken cancellationToken = default)
    {
        await _sender.Send(new DeleteCampaignCommand(id), cancellationToken);
        return NoContent();
    }

    public record UpdateCampaignRequest(
        string Name,
        string? Description,
        DiscountType DiscountType,
        decimal DiscountValue,
        DateTimeOffset StartDate,
        DateTimeOffset EndDate,
        CampaignStatus Status,
        int? UsageLimit,
        List<Guid>? ApplicableServiceIds);
}
