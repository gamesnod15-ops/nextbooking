using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Coupons.Queries.GetCoupons;

public record GetCouponsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    bool? IsActive = null,
    string? SearchTerm = null) : IRequest<PaginatedList<CouponDto>>;

public record CouponDto(
    Guid Id,
    string Code,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MinimumOrderAmount,
    DateTimeOffset? ExpiresAt,
    int? UsageLimit,
    int UsageCount,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed class GetCouponsQueryHandler : IRequestHandler<GetCouponsQuery, PaginatedList<CouponDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetCouponsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<CouponDto>> Handle(GetCouponsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Coupons
            .AsNoTracking()
            .Where(c => c.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.IsActive.HasValue)
            query = query.Where(c => c.IsActive == request.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToUpper();
            query = query.Where(c => c.Code.Contains(term));
        }

        var projected = query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CouponDto(
                c.Id, c.Code, c.Description, c.DiscountType, c.DiscountValue,
                c.MinimumOrderAmount, c.ExpiresAt, c.UsageLimit, c.UsageCount,
                c.IsActive, c.CreatedAt));

        return await PaginatedList<CouponDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}

// Commands in same file for brevity
public record CreateCouponCommand(
    string Code,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MinimumOrderAmount,
    DateTimeOffset? ExpiresAt,
    int? UsageLimit) : IRequest<Guid>;

public sealed class CreateCouponCommandHandler : IRequestHandler<CreateCouponCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.Coupons
            .AnyAsync(c => c.TenantId == _tenantService.TenantId && c.Code == request.Code.ToUpperInvariant(), cancellationToken);

        if (exists)
            throw new InvalidOperationException($"Coupon code '{request.Code}' already exists.");

        var coupon = Coupon.Create(_tenantService.TenantId, request.Code, request.DiscountType,
            request.DiscountValue, request.Description, request.MinimumOrderAmount,
            request.ExpiresAt, request.UsageLimit);

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);

        return coupon.Id;
    }
}

public class CreateCouponCommandValidator : AbstractValidator<CreateCouponCommand>
{
    public CreateCouponCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DiscountValue).GreaterThan(0);
    }
}

public record UpdateCouponCommand(
    Guid Id,
    string Code,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MinimumOrderAmount,
    DateTimeOffset? ExpiresAt,
    int? UsageLimit,
    bool IsActive) : IRequest;

public sealed class UpdateCouponCommandHandler : IRequestHandler<UpdateCouponCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Coupon {request.Id} not found.");

        coupon.Update(request.Code, request.Description, request.DiscountType,
            request.DiscountValue, request.MinimumOrderAmount, request.ExpiresAt, request.UsageLimit);
        coupon.SetActive(request.IsActive);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public record DeleteCouponCommand(Guid Id) : IRequest;

public sealed class DeleteCouponCommandHandler : IRequestHandler<DeleteCouponCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteCouponCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Coupon {request.Id} not found.");

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
