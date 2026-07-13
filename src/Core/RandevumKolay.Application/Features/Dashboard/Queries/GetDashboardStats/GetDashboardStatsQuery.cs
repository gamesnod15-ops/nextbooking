using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Dashboard.Queries.GetDashboardStats;

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public record DashboardStatsDto(
    int TodayAppointments,
    int TodayCompleted,
    int TodayCancelled,
    int TodayPending,
    decimal TodayRevenue,
    int MonthAppointments,
    decimal MonthRevenue,
    decimal OccupancyRate,
    int TotalCustomers,
    List<AppointmentSummaryDto> TodayAppointmentList,
    List<WeeklyStatDto> WeeklyStats,
    List<MonthlyStatDto> MonthlyStats);

public record AppointmentSummaryDto(
    Guid Id,
    string CustomerName,
    string ServiceName,
    string EmployeeName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    AppointmentStatus Status,
    decimal Price);

public record WeeklyStatDto(string Day, int Appointments, decimal Revenue);

public record MonthlyStatDto(string Month, int Appointments, decimal Revenue);

public sealed class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
        var todayEnd = todayStart.AddDays(1);
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var weekStart = todayStart.AddDays(-(int)now.DayOfWeek);

        // Today's appointments
        var todayAppts = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .Include(a => a.Customer)
            .Where(a => a.TenantId == tenantId &&
                        a.StartTime >= todayStart &&
                        a.StartTime < todayEnd)
            .OrderBy(a => a.StartTime)
            .ToListAsync(cancellationToken);

        var todayList = todayAppts.Select(a => new AppointmentSummaryDto(
            a.Id, a.Customer!.Name, a.Service!.Name, a.Employee!.Name,
            a.StartTime, a.EndTime, a.Status, a.Price)).ToList();

        var todayRevenue = todayAppts
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Sum(a => a.Price);

        // Month stats
        var monthAppts = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId &&
                        a.StartTime >= monthStart &&
                        a.StartTime < todayEnd)
            .ToListAsync(cancellationToken);

        var monthRevenue = monthAppts
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Sum(a => a.Price);

        // Total customers
        var totalCustomers = await _context.Customers
            .CountAsync(c => c.TenantId == tenantId, cancellationToken);

        // Weekly stats (last 7 days)
        var weekStats = new List<WeeklyStatDto>();
        var dayNames = new[] { "Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt" };
        for (int i = 6; i >= 0; i--)
        {
            var dayStart = todayStart.AddDays(-i);
            var dayEnd = dayStart.AddDays(1);
            var dayAppts = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.StartTime >= dayStart && a.StartTime < dayEnd)
                .ToListAsync(cancellationToken);
            weekStats.Add(new WeeklyStatDto(
                dayNames[(int)dayStart.DayOfWeek],
                dayAppts.Count,
                dayAppts.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price)));
        }

        // Monthly stats (last 6 months)
        var monthlyStats = new List<MonthlyStatDto>();
        var monthNames = new[] { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };
        for (int i = 5; i >= 0; i--)
        {
            var mStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero).AddMonths(-i);
            var mEnd = mStart.AddMonths(1);
            var mAppts = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.StartTime >= mStart && a.StartTime < mEnd)
                .ToListAsync(cancellationToken);
            monthlyStats.Add(new MonthlyStatDto(
                monthNames[mStart.Month - 1],
                mAppts.Count,
                mAppts.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.Price)));
        }

        // Occupancy rate: completed appointments / (total capacity in past 30 days)
        var occupancyRate = monthAppts.Count > 0
            ? Math.Round((double)monthAppts.Count(a => a.Status == AppointmentStatus.Completed) / monthAppts.Count * 100, 1)
            : 0.0;

        return new DashboardStatsDto(
            todayAppts.Count,
            todayAppts.Count(a => a.Status == AppointmentStatus.Completed),
            todayAppts.Count(a => a.Status == AppointmentStatus.Cancelled),
            todayAppts.Count(a => a.Status == AppointmentStatus.Pending),
            todayRevenue,
            monthAppts.Count,
            monthRevenue,
            (decimal)occupancyRate,
            totalCustomers,
            todayList,
            weekStats,
            monthlyStats);
    }
}
