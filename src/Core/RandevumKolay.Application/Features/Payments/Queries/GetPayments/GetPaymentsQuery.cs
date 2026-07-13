using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Payments.Queries.GetPayments;

public record GetPaymentsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    PaymentStatus? Status = null,
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    string? SearchTerm = null) : IRequest<PaginatedList<PaymentDto>>;

public record PaymentDto(
    Guid Id,
    Guid AppointmentId,
    string CustomerName,
    string ServiceName,
    string Provider,
    decimal Amount,
    string Currency,
    PaymentStatus Status,
    DateTimeOffset? PaidAt,
    DateTimeOffset CreatedAt);

public sealed class GetPaymentsQueryHandler : IRequestHandler<GetPaymentsQuery, PaginatedList<PaymentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetPaymentsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<PaymentDto>> Handle(GetPaymentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Payments
            .AsNoTracking()
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Customer)
            .Include(p => p.Appointment)
                .ThenInclude(a => a!.Service)
            .Where(p => p.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(p => p.Status == request.Status.Value);

        if (request.StartDate.HasValue)
        {
            var start = request.StartDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= start);
        }

        if (request.EndDate.HasValue)
        {
            var end = request.EndDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= end);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(p =>
                p.Appointment!.Customer!.Name.ToLower().Contains(term) ||
                p.Appointment.Service!.Name.ToLower().Contains(term));
        }

        var projected = query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto(
                p.Id,
                p.AppointmentId,
                p.Appointment!.Customer!.Name,
                p.Appointment.Service!.Name,
                p.Provider,
                p.Amount,
                p.Currency,
                p.Status,
                p.PaidAt,
                p.CreatedAt));

        return await PaginatedList<PaymentDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
