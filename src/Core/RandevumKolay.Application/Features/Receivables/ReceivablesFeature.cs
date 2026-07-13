using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Receivables;

public record InstallmentDto(Guid Id, int Number, decimal Amount, DateOnly DueDate, bool IsPaid, DateOnly? PaidAt);

public record ReceivableDto(Guid Id, string CustomerName, string? CustomerPhone, string? Description,
    decimal TotalAmount, decimal PaidAmount, decimal RemainingAmount, DateOnly DueDate,
    ReceivableStatus Status, int InstallmentCount, List<InstallmentDto> Installments, DateTimeOffset CreatedAt);

// ─── Queries ───────────────────────────────────────────────────────────────
public record GetReceivablesQuery(int PageNumber = 1, int PageSize = 20,
    string? Search = null, ReceivableStatus? Status = null) : IRequest<PaginatedList<ReceivableDto>>;

public sealed class GetReceivablesQueryHandler : IRequestHandler<GetReceivablesQuery, PaginatedList<ReceivableDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetReceivablesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<ReceivableDto>> Handle(GetReceivablesQuery request, CancellationToken ct)
    {
        var q = _context.Receivables.AsNoTracking()
            .Include(r => r.Installments)
            .Where(r => r.TenantId == _tenant.TenantId);

        if (!string.IsNullOrWhiteSpace(request.Search))
            q = q.Where(r => r.CustomerName.Contains(request.Search));
        if (request.Status.HasValue)
            q = q.Where(r => r.Status == request.Status.Value);

        q = q.OrderByDescending(r => r.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .ToListAsync(ct);

        return new PaginatedList<ReceivableDto>(items.Select(r => new ReceivableDto(
            r.Id, r.CustomerName, r.CustomerPhone, r.Description, r.TotalAmount, r.PaidAmount,
            r.RemainingAmount, r.DueDate, r.Status, r.InstallmentCount,
            r.Installments.Select(i => new InstallmentDto(i.Id, i.InstallmentNumber, i.Amount,
                i.DueDate, i.IsPaid, i.PaidAt)).ToList(), r.CreatedAt)
        ).ToList(), total, request.PageNumber, request.PageSize);
    }
}

// ─── Commands ──────────────────────────────────────────────────────────────
public record CreateReceivableCommand(string CustomerName, decimal TotalAmount, DateOnly DueDate,
    int InstallmentCount, string? CustomerPhone, string? Description) : IRequest<Guid>;

public sealed class CreateReceivableCommandHandler : IRequestHandler<CreateReceivableCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateReceivableCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateReceivableCommand request, CancellationToken ct)
    {
        var rec = Receivable.Create(_tenant.TenantId, request.CustomerName, request.TotalAmount,
            request.DueDate, request.InstallmentCount, request.CustomerPhone, request.Description);
        _context.Receivables.Add(rec);
        await _context.SaveChangesAsync(ct);

        // Create installments if more than 1
        if (request.InstallmentCount > 1)
        {
            var installmentAmount = Math.Round(request.TotalAmount / request.InstallmentCount, 2);
            for (int i = 1; i <= request.InstallmentCount; i++)
            {
                var dueDate = new DateOnly(request.DueDate.Year, request.DueDate.Month, request.DueDate.Day)
                    .AddMonths(i - 1);
                _context.Installments.Add(Installment.Create(_tenant.TenantId, rec.Id, i, installmentAmount, dueDate));
            }
            await _context.SaveChangesAsync(ct);
        }

        return rec.Id;
    }
}

public record PayInstallmentCommand(Guid InstallmentId) : IRequest;

public sealed class PayInstallmentCommandHandler : IRequestHandler<PayInstallmentCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public PayInstallmentCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(PayInstallmentCommand request, CancellationToken ct)
    {
        var inst = await _context.Installments.Include(i => i.Receivable)
            .FirstOrDefaultAsync(i => i.Id == request.InstallmentId && i.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Installment not found");
        inst.MarkPaid(DateOnly.FromDateTime(DateTime.UtcNow));
        inst.Receivable?.AddPayment(inst.Amount);
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteReceivableCommand(Guid Id) : IRequest;

public sealed class DeleteReceivableCommandHandler : IRequestHandler<DeleteReceivableCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteReceivableCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteReceivableCommand request, CancellationToken ct)
    {
        var receivable = await _context.Receivables
            .Include(r => r.Installments)
            .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Receivable not found");

        if (receivable.Installments.Count > 0)
        {
            _context.Installments.RemoveRange(receivable.Installments);
        }
        _context.Receivables.Remove(receivable);
        await _context.SaveChangesAsync(ct);
    }
}
