using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Businesses.Queries.GetBusinessCalendarAvailability;

public record GetBusinessCalendarAvailabilityQuery(
    Guid BusinessId,
    Guid ServiceId,
    int Month,
    int Year) : IRequest<List<BusinessAvailabilityDto>>;

public record BusinessAvailabilityDto(DateOnly Date, bool HasAvailability, int AvailableEmployeeCount);

public sealed class GetBusinessCalendarAvailabilityQueryHandler
    : IRequestHandler<GetBusinessCalendarAvailabilityQuery, List<BusinessAvailabilityDto>>
{
    private readonly IApplicationDbContext _context;

    public GetBusinessCalendarAvailabilityQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BusinessAvailabilityDto>> Handle(
        GetBusinessCalendarAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        var business = await _context.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BusinessId && !b.IsDeleted, cancellationToken)
            ?? throw new KeyNotFoundException("Business not found.");

        var tenantId = business.TenantId;

        var service = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.TenantId == tenantId, cancellationToken);

        if (service is null)
            return [];

        var monthStart = new DateTimeOffset(request.Year, request.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var monthEnd = monthStart.AddMonths(1);

        // Get all active employees for this business
        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId
                     && e.BusinessId == request.BusinessId
                     && e.IsActive
                     && e.AcceptsOnlineBookings
                     && !e.IsDeleted)
            .Select(e => new { e.Id, e.UserId })
            .ToListAsync(cancellationToken);

        // If no employees, the owner is the fallback — check if we can resolve them
        if (employees.Count == 0)
        {
            var owner = await _context.Users
                .Where(u => u.TenantId == tenantId && u.Role == "tenant_admin" && u.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (owner is null)
                return [];

            var ownerEmployee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.TenantId == tenantId
                                       && e.BusinessId == request.BusinessId
                                       && e.UserId == owner.Id
                                       && !e.IsDeleted, cancellationToken);

            if (ownerEmployee is null)
            {
                // Owner exists but not as employee — treat as available (will be created on booking)
                return GenerateAllDates(monthStart, monthEnd).Select(d =>
                    new BusinessAvailabilityDto(d, true, 1)).ToList();
            }

            employees = [new { ownerEmployee.Id, ownerEmployee.UserId }];
        }

        var employeeIds = employees.Select(e => e.Id).ToList();

        // Get all schedules for these employees
        var schedules = await _context.Schedules
            .AsNoTracking()
            .Where(s => employeeIds.Contains(s.EmployeeId) && s.IsActive)
            .ToListAsync(cancellationToken);

        // Get all schedule exceptions for the month
        var exceptions = await _context.ScheduleExceptions
            .AsNoTracking()
            .Where(e => employeeIds.Contains(e.EmployeeId)
                     && e.Date >= DateOnly.FromDateTime(monthStart.DateTime)
                     && e.Date < DateOnly.FromDateTime(monthEnd.DateTime))
            .ToListAsync(cancellationToken);

        // Get all non-cancelled appointments for the month
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => employeeIds.Contains(a.EmployeeId)
                     && a.Status != AppointmentStatus.Cancelled
                     && a.StartTime >= monthStart
                     && a.StartTime < monthEnd)
            .GroupBy(a => new { a.EmployeeId, Date = DateOnly.FromDateTime(a.StartTime.DateTime) })
            .Select(g => new { g.Key.EmployeeId, g.Key.Date, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var appointmentLookup = appointments
            .GroupBy(a => a.Date)
            .ToDictionary(g => g.Key, g => g.ToDictionary(a => a.EmployeeId, a => a.Count));

        var slotDuration = TimeSpan.FromMinutes(service.DurationMinutes + service.BufferMinutes);
        var serviceDuration = TimeSpan.FromMinutes(service.DurationMinutes);

        var result = new List<BusinessAvailabilityDto>();
        var current = DateOnly.FromDateTime(monthStart.DateTime);
        var endDate = DateOnly.FromDateTime(monthEnd.DateTime);

        while (current < endDate)
        {
            var availableCount = 0;

            foreach (var emp in employees)
            {
                var daySchedule = schedules.FirstOrDefault(s =>
                    s.EmployeeId == emp.Id && s.DayOfWeek == current.DayOfWeek);

                if (daySchedule is null)
                    continue;

                var exception = exceptions.FirstOrDefault(e =>
                    e.EmployeeId == emp.Id && e.Date == current);

                if (exception?.IsClosed == true)
                    continue;

                var workStart = exception?.StartTime ?? daySchedule.StartTime;
                var workEnd = exception?.EndTime ?? daySchedule.EndTime;

                var dayStartTime = current.ToDateTime(workStart, DateTimeKind.Utc);
                var dayEndTime = current.ToDateTime(workEnd, DateTimeKind.Utc);

                var maxSlots = 0;
                var slotStart = dayStartTime;
                while (slotStart.Add(serviceDuration) <= dayEndTime)
                {
                    maxSlots++;
                    slotStart = slotStart.Add(slotDuration);
                }

                var existingCount = 0;
                if (appointmentLookup.TryGetValue(current, out var dayAppointments))
                    existingCount = dayAppointments.GetValueOrDefault(emp.Id, 0);

                if (existingCount < maxSlots)
                    availableCount++;
            }

            result.Add(new BusinessAvailabilityDto(current, availableCount > 0, availableCount));
            current = current.AddDays(1);
        }

        return result;
    }

    private static List<DateOnly> GenerateAllDates(DateTimeOffset monthStart, DateTimeOffset monthEnd)
    {
        var dates = new List<DateOnly>();
        var current = DateOnly.FromDateTime(monthStart.DateTime);
        var end = DateOnly.FromDateTime(monthEnd.DateTime);
        while (current < end)
        {
            dates.Add(current);
            current = current.AddDays(1);
        }
        return dates;
    }
}
