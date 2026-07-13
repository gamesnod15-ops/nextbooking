using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Infrastructure.Services;

public class ScheduleOptimizationService : IScheduleOptimizationService
{
    private readonly IApplicationDbContext _context;
    private readonly INoShowPredictionService _predictionService;
    private readonly ILogger<ScheduleOptimizationService> _logger;

    public ScheduleOptimizationService(
        IApplicationDbContext context,
        INoShowPredictionService predictionService,
        ILogger<ScheduleOptimizationService> logger)
    {
        _context = context;
        _predictionService = predictionService;
        _logger = logger;
    }

    public async Task<List<ScheduleSuggestion>> GetScheduleOptimizationsAsync(
        Guid tenantId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default)
    {
        var suggestions = new List<ScheduleSuggestion>();

        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.IsActive && !e.IsDeleted)
            .Include(e => e.Schedules)
            .ToListAsync(ct);

        foreach (var employee in employees)
        {
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var dayOfWeek = date.DayOfWeek;

                var schedule = employee.Schedules
                    .FirstOrDefault(s => s.DayOfWeek == dayOfWeek && s.IsActive);

                if (schedule is null) continue;

                var demandScore = await CalculateDemandScoreAsync(
                    tenantId, employee.Id, date, ct);

                var appointmentsOnDate = await _context.Appointments
                    .AsNoTracking()
                    .Where(a => a.TenantId == tenantId
                             && a.EmployeeId == employee.Id
                             && a.StartTime.Date == date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).Date
                             && a.Status != AppointmentStatus.Cancelled
                             && a.Status != AppointmentStatus.NoShow
                             && !a.IsDeleted)
                    .CountAsync(ct);

                if (demandScore > 70)
                {
                    suggestions.Add(new ScheduleSuggestion(
                        employee.Id, employee.Name, date,
                        schedule.StartTime,
                        schedule.EndTime,
                        $"Yüksek talep bekleniyor (skor: {demandScore}). Mevcut randevu sayısı: {appointmentsOnDate}",
                        demandScore));
                }
                else if (demandScore < 30 && appointmentsOnDate < 3)
                {
                    suggestions.Add(new ScheduleSuggestion(
                        employee.Id, employee.Name, date,
                        schedule.StartTime,
                        schedule.EndTime,
                        $"Düşük talep (skor: {demandScore}). Çalışan kapasitesi düşürülebilir.",
                        demandScore));
                }
            }
        }

        return suggestions;
    }

    public async Task<List<OverbookingSuggestion>> GetOverbookingSuggestionsAsync(
        Guid tenantId, DateOnly date, CancellationToken ct = default)
    {
        var suggestions = new List<OverbookingSuggestion>();

        var startUtc = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endUtc = startUtc.AddDays(1);

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.StartTime >= startUtc
                     && a.StartTime < endUtc
                     && a.Status != AppointmentStatus.Cancelled
                     && a.Status != AppointmentStatus.Completed
                     && !a.IsDeleted)
            .Select(a => new { a.Id, a.CustomerId })
            .ToListAsync(ct);

        foreach (var appointment in appointments)
        {
            try
            {
                var prediction = await _predictionService.PredictNoShowAsync(
                    tenantId, appointment.Id, appointment.CustomerId, ct);

                if (prediction.Probability >= 0.4m)
                {
                    suggestions.Add(new OverbookingSuggestion(
                        appointment.Id,
                        prediction.Probability,
                        prediction.RiskLevel,
                        $"No-show riski %{prediction.Probability * 100:F0}. Aynı slot için yedek müşteri alınabilir."));
                }
            }
            catch
            {
                // Skip failed predictions for individual appointments
            }
        }

        return suggestions;
    }

    public async Task<List<ScheduleSuggestion>> GetDemandForecastAsync(
        Guid tenantId, DateOnly startDate, DateOnly endDate, CancellationToken ct = default)
    {
        var suggestions = new List<ScheduleSuggestion>();

        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId && e.IsActive && !e.IsDeleted)
            .ToListAsync(ct);

        foreach (var employee in employees)
        {
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var demandScore = await CalculateDemandScoreAsync(
                    tenantId, employee.Id, date, ct);

                suggestions.Add(new ScheduleSuggestion(
                    employee.Id, employee.Name, date,
                    TimeOnly.FromTimeSpan(TimeSpan.FromHours(9)),
                    TimeOnly.FromTimeSpan(TimeSpan.FromHours(18)),
                    $"Tahmini talep skoru: {demandScore}/100",
                    demandScore));
            }
        }

        return suggestions;
    }

    private async Task<int> CalculateDemandScoreAsync(
        Guid tenantId, Guid employeeId, DateOnly date, CancellationToken ct)
    {
        var dayOfWeek = date.DayOfWeek;
        var score = 50;

        var historicalCount = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.EmployeeId == employeeId
                     && a.StartTime.DayOfWeek == dayOfWeek
                     && a.Status == AppointmentStatus.Completed
                     && !a.IsDeleted)
            .CountAsync(ct);

        if (historicalCount > 20) score += 20;
        else if (historicalCount > 10) score += 10;

        var appointmentsThisWeek = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.EmployeeId == employeeId
                     && a.StartTime.Year == date.Year
                     && a.StartTime.Month == date.Month
                     && a.Status != AppointmentStatus.Cancelled
                     && !a.IsDeleted)
            .CountAsync(ct);

        var daysInMonth = DateTime.DaysInMonth(date.Year, date.Month);
        var avgPerDay = daysInMonth > 0 ? (double)appointmentsThisWeek / daysInMonth : 0;

        if (avgPerDay > 5) score += 15;
        else if (avgPerDay > 3) score += 5;

        var month = date.Month;
        if (month == 5 || month == 6 || month == 9 || month == 12)
            score += 10;
        else if (month == 1 || month == 2)
            score -= 10;

        return Math.Clamp(score, 0, 100);
    }
}
