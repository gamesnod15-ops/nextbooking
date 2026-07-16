using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Forms;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class FormsController : ControllerBase
{
    private readonly ISender _sender;
    public FormsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetForms(CancellationToken ct)
        => Ok(await _sender.Send(new GetFormsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> CreateForm([FromBody] CreateFormCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetForms), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateForm(Guid id, [FromBody] UpdateFormCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteForm(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteFormCommand(id), ct);
        return NoContent();
    }
}
