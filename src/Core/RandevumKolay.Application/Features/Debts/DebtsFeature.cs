using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Debts;

public record DebtDto(Guid Id, string Title, string? CreditorName, string? Description,
    decimal TotalAmount, decimal PaidAmount, decimal RemainingAmount, DateOnly DueDate,
    DebtCategory Category, DebtStatus Status, DateTimeOffset CreatedAt);

public record GetDebtsQuery(int PageNumber = 1, int PageSize = 20,
    string? Search = null, DebtStatus? Status = null) : IRequest<PaginatedList<DebtDto>>;

public sealed class GetDebtsQueryHandler : IRequestHandler<GetDebtsQuery, PaginatedList<DebtDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetDebtsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<DebtDto>> Handle(GetDebtsQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var q = _context.DebtRecords.AsNoTracking()
            .Where(d => d.TenantId == _tenant.TenantId);
        if (!string.IsNullOrWhiteSpace(request.Search))
            q = q.Where(d => d.Title.Contains(request.Search) || (d.CreditorName != null && d.CreditorName.Contains(request.Search)));

        // Overdue/Open/PartiallyPaid are derived from persisted Status + DueDate —
        // Overdue itself is never persisted, it's computed at read time.
        if (request.Status.HasValue)
        {
            q = request.Status.Value switch
            {
                DebtStatus.Overdue => q.Where(d => d.Status != DebtStatus.Paid && d.DueDate < today),
                DebtStatus.Paid => q.Where(d => d.Status == DebtStatus.Paid),
                _ => q.Where(d => d.Status == request.Status.Value && d.DueDate >= today),
            };
        }

        q = q.OrderByDescending(d => d.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(d => new DebtDto(d.Id, d.Title, d.CreditorName, d.Description,
                d.TotalAmount, d.PaidAmount, d.RemainingAmount, d.DueDate,
                d.Category, d.Status, d.CreatedAt))
            .ToListAsync(ct);

        var mapped = items.Select(d => d with
        {
            Status = d.Status != DebtStatus.Paid && d.DueDate < today ? DebtStatus.Overdue : d.Status,
        }).ToList();

        return new PaginatedList<DebtDto>(mapped, total, request.PageNumber, request.PageSize);
    }
}

public record CreateDebtCommand(string Title, decimal TotalAmount, DateOnly DueDate,
    DebtCategory Category, string? CreditorName, string? Description) : IRequest<Guid>;

public sealed class CreateDebtCommandHandler : IRequestHandler<CreateDebtCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateDebtCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateDebtCommand request, CancellationToken ct)
    {
        var debt = DebtRecord.Create(_tenant.TenantId, request.Title, request.TotalAmount,
            request.DueDate, request.Category, request.CreditorName, request.Description);
        _context.DebtRecords.Add(debt);
        await _context.SaveChangesAsync(ct);
        return debt.Id;
    }
}

public record UpdateDebtCommand(Guid Id, string Title, decimal TotalAmount, DateOnly DueDate,
    DebtCategory Category, string? CreditorName, string? Description) : IRequest;

public sealed class UpdateDebtCommandHandler : IRequestHandler<UpdateDebtCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateDebtCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateDebtCommand request, CancellationToken ct)
    {
        var debt = await _context.DebtRecords
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Debt record not found");
        debt.Update(request.Title, request.TotalAmount, request.DueDate, request.Category,
            request.CreditorName, request.Description);
        await _context.SaveChangesAsync(ct);
    }
}

public record PayDebtCommand(Guid Id, decimal Amount) : IRequest;

public sealed class PayDebtCommandHandler : IRequestHandler<PayDebtCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public PayDebtCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(PayDebtCommand request, CancellationToken ct)
    {
        var debt = await _context.DebtRecords
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Debt record not found");
        debt.AddPayment(request.Amount);
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteDebtCommand(Guid Id) : IRequest;

public sealed class DeleteDebtCommandHandler : IRequestHandler<DeleteDebtCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteDebtCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteDebtCommand request, CancellationToken ct)
    {
        var debt = await _context.DebtRecords
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Debt record not found");

        _context.DebtRecords.Remove(debt);
        await _context.SaveChangesAsync(ct);
    }
}
