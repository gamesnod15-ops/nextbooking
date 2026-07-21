using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Queries.GetAppointments;

public record GetAppointmentsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    DateOnly? Date = null,
    Guid? EmployeeId = null,
    AppointmentStatus? Status = null,
    string? SearchTerm = null) : IRequest<PaginatedList<AppointmentDto>>;

public record AppointmentDto(
    Guid Id,
    Guid ServiceId,
    string ServiceName,
    int ServiceDurationMinutes,
    Guid EmployeeId,
    string EmployeeName,
    Guid CustomerId,
    string CustomerName,
    string CustomerPhone,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    AppointmentStatus Status,
    decimal Price,
    string? Notes,
    string Source,
    bool HasPayment,
    DateTimeOffset CreatedAt);

public sealed class GetAppointmentsQueryHandler
    : IRequestHandler<GetAppointmentsQuery, PaginatedList<AppointmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetAppointmentsQueryHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<AppointmentDto>> Handle(
        GetAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Appointments
            .AsNoTracking()
            .Where(a => (_tenantService.TenantIdOrNull == null || a.TenantId == _tenantService.TenantIdOrNull) && !a.IsDeleted)
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .Include(a => a.Customer)
            .AsQueryable();

        if (request.Date.HasValue)
        {
            var startOfDay = request.Date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var endOfDay = request.Date.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(a => a.StartTime >= startOfDay && a.StartTime <= endOfDay);
        }

        if (request.EmployeeId.HasValue)
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);

        if (request.Status.HasValue)
            query = query.Where(a => a.Status == request.Status.Value);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(a =>
                a.Customer!.Name.ToLower().Contains(term) ||
                a.Customer.Phone.Contains(term) ||
                (a.Customer.Email != null && a.Customer.Email.ToLower().Contains(term)));
        }

        var projected = query
            .OrderBy(a => a.StartTime)
            .Select(a => new AppointmentDto(
                a.Id,
                a.ServiceId,
                a.Service!.Name,
                a.Service.DurationMinutes,
                a.EmployeeId,
                a.Employee!.Name,
                a.CustomerId,
                a.Customer!.Name,
                a.Customer.Phone,
                a.StartTime,
                a.EndTime,
                a.Status,
                a.Price,
                a.Notes,
                a.Source,
                _context.Payments.Any(p => p.AppointmentId == a.Id && p.Status == PaymentStatus.Completed),
                a.CreatedAt));

        return await PaginatedList<AppointmentDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
