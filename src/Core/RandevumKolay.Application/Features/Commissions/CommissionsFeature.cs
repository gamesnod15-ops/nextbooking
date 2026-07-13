using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Commissions;

public record CommissionDto(Guid Id, Guid EmployeeId, string EmployeeName, string Period,
    CommissionType Type, decimal BaseAmount, decimal CommissionRate, decimal CommissionAmount,
    decimal BonusAmount, decimal TotalAmount, CommissionStatus Status, string? Notes, DateTimeOffset CreatedAt);

public record GetCommissionsQuery(int PageNumber = 1, int PageSize = 20,
    string? Period = null, CommissionStatus? Status = null) : IRequest<PaginatedList<CommissionDto>>;

public sealed class GetCommissionsQueryHandler : IRequestHandler<GetCommissionsQuery, PaginatedList<CommissionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetCommissionsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<CommissionDto>> Handle(GetCommissionsQuery request, CancellationToken ct)
    {
        var q = _context.EmployeeCommissions.AsNoTracking()
            .Where(c => c.TenantId == _tenant.TenantId);
        if (!string.IsNullOrWhiteSpace(request.Period))
            q = q.Where(c => c.Period == request.Period);
        if (request.Status.HasValue)
            q = q.Where(c => c.Status == request.Status.Value);

        q = q.OrderByDescending(c => c.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(c => new CommissionDto(c.Id, c.EmployeeId, c.EmployeeName, c.Period,
                c.Type, c.BaseAmount, c.CommissionRate, c.CommissionAmount, c.BonusAmount,
                c.TotalAmount, c.Status, c.Notes, c.CreatedAt))
            .ToListAsync(ct);

        return new PaginatedList<CommissionDto>(items, total, request.PageNumber, request.PageSize);
    }
}

public record CreateCommissionCommand(Guid EmployeeId, string EmployeeName, string Period,
    CommissionType Type, decimal BaseAmount, decimal CommissionRate,
    decimal BonusAmount, string? Notes) : IRequest<Guid>;

public sealed class CreateCommissionCommandHandler : IRequestHandler<CreateCommissionCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateCommissionCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateCommissionCommand request, CancellationToken ct)
    {
        var commission = EmployeeCommission.Create(_tenant.TenantId, request.EmployeeId,
            request.EmployeeName, request.Period, request.Type, request.BaseAmount,
            request.CommissionRate, request.BonusAmount, request.Notes);
        _context.EmployeeCommissions.Add(commission);
        await _context.SaveChangesAsync(ct);
        return commission.Id;
    }
}

public record ApproveCommissionCommand(Guid Id) : IRequest;

public sealed class ApproveCommissionCommandHandler : IRequestHandler<ApproveCommissionCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public ApproveCommissionCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(ApproveCommissionCommand request, CancellationToken ct)
    {
        var c = await _context.EmployeeCommissions
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Commission not found");
        c.Approve();
        await _context.SaveChangesAsync(ct);
    }
}

public record PayCommissionCommand(Guid Id) : IRequest;

public sealed class PayCommissionCommandHandler : IRequestHandler<PayCommissionCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public PayCommissionCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(PayCommissionCommand request, CancellationToken ct)
    {
        var c = await _context.EmployeeCommissions
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Commission not found");
        c.MarkPaid();
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteCommissionCommand(Guid Id) : IRequest;

public sealed class DeleteCommissionCommandHandler : IRequestHandler<DeleteCommissionCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteCommissionCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteCommissionCommand request, CancellationToken ct)
    {
        var commission = await _context.EmployeeCommissions
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Commission not found");

        _context.EmployeeCommissions.Remove(commission);
        await _context.SaveChangesAsync(ct);
    }
}
