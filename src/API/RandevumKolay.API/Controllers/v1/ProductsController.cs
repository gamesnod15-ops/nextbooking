using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RandevumKolay.Application.Features.Products;

namespace RandevumKolay.API.Controllers.v1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ISender _sender;
    public ProductsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? category = null,
        [FromQuery] bool? lowStockOnly = null, CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetProductsQuery(pageNumber, pageSize, search, category, lowStockOnly), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var id = await _sender.Send(command, ct);
        return CreatedAtAction(nameof(GetProducts), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadProductImage(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file is not { Length: > 0 })
            return BadRequest(new { message = "Dosya gerekli." });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
            return BadRequest(new { message = "Yalnızca JPG, PNG ve WebP dosyalarına izin verilir." });

        var fileName = $"{id}_{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        var url = $"/uploads/products/{fileName}";
        await _sender.Send(new UpdateProductImageCommand(id, url), ct);
        return Ok(new { url });
    }
}
