using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Products;

// ─── DTOs ─────────────────────────────────────────────────────────────────
public record ProductDto(
    Guid Id,
    string Name,
    string? Description,
    string? Category,
    string? Barcode,
    decimal SalePrice,
    decimal? CostPrice,
    int StockQuantity,
    int MinStockLevel,
    string Unit,
    bool IsActive,
    bool IsLowStock,
    DateTimeOffset CreatedAt);

// ─── Queries ───────────────────────────────────────────────────────────────
public record GetProductsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    string? Category = null,
    bool? LowStockOnly = null) : IRequest<PaginatedList<ProductDto>>;

public sealed class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PaginatedList<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetProductsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<ProductDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var q = _context.Products
            .AsNoTracking()
            .Where(p => p.TenantId == _tenant.TenantId);

        if (!string.IsNullOrWhiteSpace(request.Search))
            q = q.Where(p => p.Name.Contains(request.Search) || (p.Barcode != null && p.Barcode.Contains(request.Search)));
        if (!string.IsNullOrWhiteSpace(request.Category))
            q = q.Where(p => p.Category == request.Category);
        if (request.LowStockOnly == true)
            q = q.Where(p => p.StockQuantity <= p.MinStockLevel);

        q = q.OrderByDescending(p => p.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(p => new ProductDto(p.Id, p.Name, p.Description, p.Category, p.Barcode,
                p.SalePrice, p.CostPrice, p.StockQuantity, p.MinStockLevel, p.Unit, p.IsActive,
                p.StockQuantity <= p.MinStockLevel, p.CreatedAt))
            .ToListAsync(ct);

        return new PaginatedList<ProductDto>(items, total, request.PageNumber, request.PageSize);
    }
}

// ─── Commands ──────────────────────────────────────────────────────────────
public record CreateProductCommand(string Name, decimal SalePrice, int StockQuantity,
    string? Category, string? Barcode, decimal? CostPrice, int MinStockLevel,
    string Unit, string? Description) : IRequest<Guid>;

public sealed class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateProductCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var product = Product.Create(_tenant.TenantId, request.Name, request.SalePrice,
            request.StockQuantity, request.Category, request.Barcode, request.CostPrice,
            request.MinStockLevel, request.Unit, request.Description);
        _context.Products.Add(product);
        await _context.SaveChangesAsync(ct);
        return product.Id;
    }
}

public record UpdateProductCommand(Guid Id, string Name, decimal SalePrice, int StockQuantity,
    string? Category, string? Barcode, decimal? CostPrice, int MinStockLevel,
    string Unit, string? Description) : IRequest;

public sealed class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateProductCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await _context.Products.FirstOrDefaultAsync(
            p => p.Id == request.Id && p.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Product not found");
        product.Update(request.Name, request.SalePrice, request.StockQuantity, request.Category,
            request.Barcode, request.CostPrice, request.MinStockLevel, request.Unit, request.Description);
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteProductCommand(Guid Id) : IRequest;

public sealed class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteProductCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteProductCommand request, CancellationToken ct)
    {
        var product = await _context.Products.FirstOrDefaultAsync(
            p => p.Id == request.Id && p.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Product not found");
        _context.Products.Remove(product);
        await _context.SaveChangesAsync(ct);
    }
}
