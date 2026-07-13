using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using System.Globalization;

namespace RandevumKolay.Application.Features.Performance;

public record EmployeePerformanceDto(
    Guid EmployeeId,
    string EmployeeName,
    string? Title,
    int TotalAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    decimal TotalRevenue,
    decimal CompletionRate,
    double AvgDailyAppointments);

public record GetEmployeePerformanceQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? PeriodStart = null,
    string? PeriodEnd = null) : IRequest<PaginatedList<EmployeePerformanceDto>>;

public sealed class GetEmployeePerformanceQueryHandler
    : IRequestHandler<GetEmployeePerformanceQuery, PaginatedList<EmployeePerformanceDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetEmployeePerformanceQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<EmployeePerformanceDto>> Handle(
        GetEmployeePerformanceQuery request, CancellationToken ct)
    {
        var start = ParseUtcBoundary(request.PeriodStart, isEndBoundary: false)
            ?? DateTimeOffset.UtcNow.AddDays(-30);
        var endExclusive = ParseUtcBoundary(request.PeriodEnd, isEndBoundary: true)
            ?? DateTimeOffset.UtcNow;

        var employees = await _context.Employees.AsNoTracking()
            .Where(e => e.TenantId == _tenant.TenantId && e.IsActive)
            .Select(e => new { e.Id, e.Name, e.Title })
            .ToListAsync(ct);

        var appointments = await _context.Appointments.AsNoTracking()
            .Where(a => a.TenantId == _tenant.TenantId
                && a.StartTime >= start && a.StartTime < endExclusive)
            .Select(a => new { a.EmployeeId, a.Status, a.StartTime })
            .ToListAsync(ct);

        var payments = await _context.Payments.AsNoTracking()
            .Where(p => p.TenantId == _tenant.TenantId
                && p.PaidAt >= start && p.PaidAt < endExclusive
                && p.Status == Domain.Entities.PaymentStatus.Completed)
            .Join(_context.Appointments.AsNoTracking()
                .Where(a => a.TenantId == _tenant.TenantId),
                p => p.AppointmentId,
                a => a.Id,
                (p, a) => new { a.EmployeeId, p.Amount })
            .ToListAsync(ct);

        double days = Math.Max(1, (endExclusive - start).TotalDays);

        var result = employees.Select(e =>
        {
            var apts = appointments.Where(a => a.EmployeeId == e.Id).ToList();
            var completed = apts.Count(a => a.Status == Domain.Entities.AppointmentStatus.Completed);
            var cancelled = apts.Count(a => a.Status == Domain.Entities.AppointmentStatus.Cancelled);
            var revenue = payments.Where(p => p.EmployeeId == e.Id).Sum(p => p.Amount);
            var rate = apts.Count > 0 ? Math.Round((double)completed / apts.Count * 100, 1) : 0;

            return new EmployeePerformanceDto(e.Id, e.Name, e.Title, apts.Count, completed,
                cancelled, revenue, (decimal)rate, Math.Round(apts.Count / days, 1));
        }).OrderByDescending(e => e.TotalAppointments).ToList();

        var total = result.Count;
        var paged = result.Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize).ToList();

        return new PaginatedList<EmployeePerformanceDto>(paged, total, request.PageNumber, request.PageSize);
    }

    private static DateTimeOffset? ParseUtcBoundary(string? value, bool isEndBoundary)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var dateOnly))
        {
            var dateTime = dateOnly.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            return new DateTimeOffset(isEndBoundary ? dateTime.AddDays(1) : dateTime);
        }

        var parsed = DateTimeOffset.Parse(value, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);

        return isEndBoundary ? parsed.ToUniversalTime() : parsed.ToUniversalTime();
    }
}
