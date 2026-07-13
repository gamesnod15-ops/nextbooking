using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Deposits.Queries.GetDeposits;

public record GetDepositsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    DepositStatus? Status = null,
    Guid? AppointmentId = null) : IRequest<DepositListResult>;

public record DepositListResult(
    List<DepositItem> Items,
    int TotalCount,
    int TotalPages);

public record DepositItem(
    Guid Id,
    Guid AppointmentId,
    string CustomerName,
    string ServiceName,
    decimal Amount,
    string Currency,
    string Status,
    string PaymentMethod,
    DateTimeOffset? PaidAt,
    DateTimeOffset? RefundedAt,
    string? Notes,
    DateTimeOffset CreatedAt);

public sealed class GetDepositsQueryHandler
    : IRequestHandler<GetDepositsQuery, DepositListResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetDepositsQueryHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<DepositListResult> Handle(
        GetDepositsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Deposits
            .AsNoTracking()
            .Where(d => d.TenantId == _tenantService.TenantId && !d.IsDeleted)
            .Include(d => d.Appointment).ThenInclude(a => a!.Customer)
            .Include(d => d.Appointment).ThenInclude(a => a!.Service)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(d => d.Status == request.Status.Value);

        if (request.AppointmentId.HasValue)
            query = query.Where(d => d.AppointmentId == request.AppointmentId.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(d => new DepositItem(
                d.Id,
                d.AppointmentId,
                d.Appointment!.Customer!.Name,
                d.Appointment.Service!.Name,
                d.Amount,
                d.Currency,
                d.Status.ToString(),
                d.PaymentMethod,
                d.PaidAt,
                d.RefundedAt,
                d.Notes,
                d.CreatedAt))
            .ToListAsync(cancellationToken);

        return new DepositListResult(items, totalCount, totalPages);
    }
}
