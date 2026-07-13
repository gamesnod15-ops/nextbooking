using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Reports.Queries.GetReports;

public record GetReportsQuery(
    DateOnly StartDate,
    DateOnly EndDate,
    string? EmployeeId = null,
    string? ServiceId = null) : IRequest<ReportsDto>;

public record ReportsDto(
    ReportsKpiDto Kpis,
    List<RevenueTimelineDto> RevenueTimeline,
    List<ServiceBreakdownDto> ServiceBreakdown,
    List<EmployeePerformanceDto> EmployeePerformance,
    List<DailyBreakdownDto> DailyBreakdown,
    List<StatusBreakdownDto> StatusBreakdown);

public record ReportsKpiDto(
    int TotalAppointments,
    int CompletedAppointments,
    int CancelledAppointments,
    int PendingAppointments,
    decimal TotalRevenue,
    decimal AverageBasket,
    decimal CancellationRate,
    decimal CompletionRate,
    int NewCustomers,
    int UniqueCustomers);

public record RevenueTimelineDto(string Label, decimal Revenue, int Appointments);

public record ServiceBreakdownDto(string ServiceName, int Count, decimal Revenue, decimal Percentage);

public record EmployeePerformanceDto(
    string EmployeeName,
    int Appointments,
    int Completed,
    decimal Revenue,
    decimal CompletionRate);

public record DailyBreakdownDto(string Date, int Appointments, decimal Revenue);

public record StatusBreakdownDto(string Status, int Count, decimal Percentage);

public sealed class GetReportsQueryHandler : IRequestHandler<GetReportsQuery, ReportsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetReportsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<ReportsDto> Handle(GetReportsQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var startUtc = new DateTimeOffset(request.StartDate.Year, request.StartDate.Month, request.StartDate.Day, 0, 0, 0, TimeSpan.Zero);
        var endUtc = new DateTimeOffset(request.EndDate.Year, request.EndDate.Month, request.EndDate.Day, 23, 59, 59, TimeSpan.Zero);

        var query = _context.Appointments
            .AsNoTracking()
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .Include(a => a.Customer)
            .Where(a => a.TenantId == tenantId &&
                        a.StartTime >= startUtc &&
                        a.StartTime <= endUtc &&
                        !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.EmployeeId) && Guid.TryParse(request.EmployeeId, out var empId))
            query = query.Where(a => a.EmployeeId == empId);

        if (!string.IsNullOrWhiteSpace(request.ServiceId) && Guid.TryParse(request.ServiceId, out var svcId))
            query = query.Where(a => a.ServiceId == svcId);

        var appointments = await query.ToListAsync(cancellationToken);

        // KPIs
        var total = appointments.Count;
        var completed = appointments.Count(a => a.Status == AppointmentStatus.Completed);
        var cancelled = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var pending = appointments.Count(a => a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed);
        var totalRevenue = appointments.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price);
        var avgBasket = completed > 0 ? Math.Round(totalRevenue / completed, 2) : 0;
        var cancelRate = total > 0 ? Math.Round((decimal)cancelled / total * 100, 1) : 0;
        var completionRate = total > 0 ? Math.Round((decimal)completed / total * 100, 1) : 0;
        var uniqueCustomers = appointments.Select(a => a.CustomerId).Distinct().Count();

        // New customers in period
        var startDate = request.StartDate;
        var newCustomers = await _context.Customers
            .AsNoTracking()
            .CountAsync(c => c.TenantId == tenantId &&
                             DateOnly.FromDateTime(c.CreatedAt.DateTime) >= startDate &&
                             DateOnly.FromDateTime(c.CreatedAt.DateTime) <= request.EndDate,
                        cancellationToken);

        var kpis = new ReportsKpiDto(total, completed, cancelled, pending, totalRevenue, avgBasket, cancelRate, completionRate, newCustomers, uniqueCustomers);

        // Revenue timeline: day-by-day
        var dayCount = (request.EndDate.DayNumber - request.StartDate.DayNumber) + 1;
        var revenueTimeline = new List<RevenueTimelineDto>();

        if (dayCount <= 31)
        {
            // Daily grouping
            for (int i = 0; i < dayCount; i++)
            {
                var d = request.StartDate.AddDays(i);
                var dayAppts = appointments.Where(a => DateOnly.FromDateTime(a.StartTime.Date) == d).ToList();
                revenueTimeline.Add(new RevenueTimelineDto(
                    d.ToString("dd MMM"),
                    dayAppts.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price),
                    dayAppts.Count));
            }
        }
        else if (dayCount <= 90)
        {
            // Weekly grouping
            var weekStart = request.StartDate;
            while (weekStart <= request.EndDate)
            {
                var weekEnd = weekStart.AddDays(6);
                if (weekEnd > request.EndDate) weekEnd = request.EndDate;
                var weekAppts = appointments.Where(a =>
                {
                    var d = DateOnly.FromDateTime(a.StartTime.Date);
                    return d >= weekStart && d <= weekEnd;
                }).ToList();
                revenueTimeline.Add(new RevenueTimelineDto(
                    weekStart.ToString("dd MMM"),
                    weekAppts.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price),
                    weekAppts.Count));
                weekStart = weekStart.AddDays(7);
            }
        }
        else
        {
            // Monthly grouping
            var month = new DateOnly(request.StartDate.Year, request.StartDate.Month, 1);
            var endMonth = new DateOnly(request.EndDate.Year, request.EndDate.Month, 1);
            var monthNames = new[] { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };
            while (month <= endMonth)
            {
                var mAppts = appointments.Where(a =>
                    a.StartTime.Year == month.Year && a.StartTime.Month == month.Month).ToList();
                revenueTimeline.Add(new RevenueTimelineDto(
                    monthNames[month.Month - 1],
                    mAppts.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price),
                    mAppts.Count));
                month = month.AddMonths(1);
            }
        }

        // Service breakdown
        var serviceGroups = appointments
            .GroupBy(a => a.Service?.Name ?? "Bilinmeyen")
            .Select(g => new
            {
                Name = g.Key,
                Count = g.Count(),
                Revenue = g.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price)
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        var serviceBreakdown = serviceGroups.Select(g => new ServiceBreakdownDto(
            g.Name,
            g.Count,
            g.Revenue,
            total > 0 ? Math.Round((decimal)g.Count / total * 100, 1) : 0)).ToList();

        // Employee performance
        var empGroups = appointments
            .GroupBy(a => a.Employee?.Name ?? "Bilinmeyen")
            .Select(g => new
            {
                Name = g.Key,
                Total = g.Count(),
                Completed = g.Count(a => a.Status == AppointmentStatus.Completed),
                Revenue = g.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price)
            })
            .OrderByDescending(g => g.Revenue)
            .ToList();

        var employeePerformance = empGroups.Select(g => new EmployeePerformanceDto(
            g.Name,
            g.Total,
            g.Completed,
            g.Revenue,
            g.Total > 0 ? Math.Round((decimal)g.Completed / g.Total * 100, 1) : 0)).ToList();

        // Daily breakdown
        var dailyBreakdown = appointments
            .GroupBy(a => DateOnly.FromDateTime(a.StartTime.Date))
            .OrderBy(g => g.Key)
            .Select(g => new DailyBreakdownDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price)))
            .ToList();

        // Status breakdown
        var statusLabels = new Dictionary<AppointmentStatus, string>
        {
            [AppointmentStatus.Pending] = "Beklemede",
            [AppointmentStatus.Confirmed] = "Onaylandı",
            [AppointmentStatus.Completed] = "Tamamlandı",
            [AppointmentStatus.Cancelled] = "İptal",
            [AppointmentStatus.NoShow] = "Gelmedi",
        };

        var statusBreakdown = appointments
            .GroupBy(a => a.Status)
            .Select(g => new StatusBreakdownDto(
                statusLabels.GetValueOrDefault(g.Key, g.Key.ToString()),
                g.Count(),
                total > 0 ? Math.Round((decimal)g.Count() / total * 100, 1) : 0))
            .OrderByDescending(s => s.Count)
            .ToList();

        return new ReportsDto(kpis, revenueTimeline, serviceBreakdown, employeePerformance, dailyBreakdown, statusBreakdown);
    }
}
