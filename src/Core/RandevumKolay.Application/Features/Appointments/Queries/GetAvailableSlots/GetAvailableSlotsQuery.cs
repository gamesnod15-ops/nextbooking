using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Queries.GetAvailableSlots;

public record GetAvailableSlotsQuery(
    Guid? EmployeeId,
    Guid ServiceId,
    DateOnly Date,
    Guid? BusinessId = null) : IRequest<List<TimeSlotDto>>;

public record TimeSlotDto(DateTimeOffset StartTime, DateTimeOffset EndTime, bool IsAvailable);

public sealed class GetAvailableSlotsQueryHandler
    : IRequestHandler<GetAvailableSlotsQuery, List<TimeSlotDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAvailableSlotsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TimeSlotDto>> Handle(
        GetAvailableSlotsQuery request,
        CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && !s.IsDeleted, cancellationToken);

        if (service is null) return [];

        var tenantId = service.TenantId;

        if (request.EmployeeId.HasValue)
        {
            return await GetSlotsForEmployeeAsync(
                request.EmployeeId.Value, service, tenantId, request.Date, cancellationToken);
        }

        return await GetSlotsForBusinessAsync(
            service, tenantId, request.Date, cancellationToken);
    }

    // Falls back to when no per-employee shift is configured — a missing
    // Schedule row shouldn't make a day look fully booked out.
    private static readonly TimeOnly DefaultWorkStart = new(9, 0);
    private static readonly TimeOnly DefaultWorkEnd = new(20, 0);

    private async Task<List<TimeSlotDto>> GetSlotsForEmployeeAsync(
        Guid employeeId, Service service, Guid tenantId, DateOnly date,
        CancellationToken cancellationToken)
    {
        var exception = await _context.ScheduleExceptions
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId
                                   && e.Date == date, cancellationToken);

        if (exception?.IsClosed == true) return [];

        var schedule = await _context.Schedules
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.EmployeeId == employeeId
                                   && s.DayOfWeek == date.DayOfWeek
                                   && s.IsActive, cancellationToken);

        var workStart = exception?.StartTime ?? schedule?.StartTime ?? DefaultWorkStart;
        var workEnd = exception?.EndTime ?? schedule?.EndTime ?? DefaultWorkEnd;

        var busySlots = await GetBusySlotsAsync(employeeId, service, date, tenantId, cancellationToken);

        return GenerateSlots(service, date, workStart, workEnd, busySlots);
    }

    private async Task<List<TimeSlotDto>> GetSlotsForBusinessAsync(
        Service service, Guid tenantId, DateOnly date,
        CancellationToken cancellationToken)
    {
        var employees = await _context.Employees
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId
                     && e.BusinessId == service.BusinessId
                     && e.IsActive
                     && e.AcceptsOnlineBookings
                     && !e.IsDeleted)
            .Select(e => e.Id)
            .ToListAsync(cancellationToken);

        if (employees.Count == 0)
        {
            var owner = await _context.Users
                .Where(u => u.TenantId == tenantId && u.Role == "tenant_admin" && u.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (owner is null) return [];

            return await GetSlotsForBusinessWithOwnerFallbackAsync(
                service, tenantId, date, owner.Id, cancellationToken);
        }

        var allSchedules = await _context.Schedules
            .AsNoTracking()
            .Where(s => employees.Contains(s.EmployeeId) && s.IsActive
                     && s.DayOfWeek == date.DayOfWeek)
            .ToListAsync(cancellationToken);

        var allExceptions = await _context.ScheduleExceptions
            .AsNoTracking()
            .Where(e => employees.Contains(e.EmployeeId) && e.Date == date)
            .ToListAsync(cancellationToken);

        var allBusySlots = await _context.Appointments
            .AsNoTracking()
            .Where(a => employees.Contains(a.EmployeeId)
                     && a.Status != AppointmentStatus.Cancelled
                     && a.StartTime >= date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                     && a.EndTime <= date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc))
            .Select(a => new { a.EmployeeId, a.StartTime, a.EndTime })
            .ToListAsync(cancellationToken);

        var slotDuration = TimeSpan.FromMinutes(service.DurationMinutes + service.BufferMinutes);
        var serviceDuration = TimeSpan.FromMinutes(service.DurationMinutes);

        var mergedSlots = new List<(DateTimeOffset Start, DateTimeOffset End)>();

        foreach (var empId in employees)
        {
            var exception = allExceptions.FirstOrDefault(e => e.EmployeeId == empId);
            if (exception?.IsClosed == true) continue;

            var schedule = allSchedules.FirstOrDefault(s => s.EmployeeId == empId);

            var workStart = exception?.StartTime ?? schedule?.StartTime ?? DefaultWorkStart;
            var workEnd = exception?.EndTime ?? schedule?.EndTime ?? DefaultWorkEnd;

            var empBusySlots = allBusySlots
                .Where(b => b.EmployeeId == empId)
                .Select(b => (b.StartTime, b.EndTime))
                .ToList();

            var current = date.ToDateTime(workStart, DateTimeKind.Utc);
            var end = date.ToDateTime(workEnd, DateTimeKind.Utc);

            while (current.Add(serviceDuration) <= end)
            {
                var slotEnd = current.AddMinutes(service.DurationMinutes);
                var isBusy = empBusySlots.Any(b =>
                    b.StartTime < new DateTimeOffset(slotEnd) &&
                    b.EndTime > new DateTimeOffset(current));

                if (!isBusy)
                    mergedSlots.Add((new DateTimeOffset(current, TimeSpan.Zero),
                                     new DateTimeOffset(slotEnd, TimeSpan.Zero)));

                current = current.Add(slotDuration);
            }
        }

        mergedSlots = mergedSlots
            .OrderBy(s => s.Start)
            .Distinct()
            .ToList();

        return mergedSlots
            .Select(s => new TimeSlotDto(s.Start, s.End, true))
            .ToList();
    }

    private async Task<List<TimeSlotDto>> GetSlotsForBusinessWithOwnerFallbackAsync(
        Service service, Guid tenantId, DateOnly date, Guid ownerUserId,
        CancellationToken cancellationToken)
    {
        var ownerEmployee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.TenantId == tenantId
                                   && e.BusinessId == service.BusinessId
                                   && e.UserId == ownerUserId
                                   && !e.IsDeleted, cancellationToken);

        if (ownerEmployee is not null)
        {
            return await GetSlotsForEmployeeAsync(
                ownerEmployee.Id, service, tenantId, date, cancellationToken);
        }

        // Owner has no employee record nor schedule — assume full-day availability (9:00-18:00)
        var defaultStart = new TimeOnly(9, 0);
        var defaultEnd = new TimeOnly(18, 0);

        return GenerateSlots(service, date, defaultStart, defaultEnd, []);
    }

    private static List<TimeSlotDto> GenerateSlots(
        Service service, DateOnly date, TimeOnly workStart, TimeOnly workEnd,
        List<(DateTimeOffset StartTime, DateTimeOffset EndTime)> busySlots)
    {
        var slots = new List<TimeSlotDto>();
        var slotDuration = TimeSpan.FromMinutes(service.DurationMinutes + service.BufferMinutes);
        var current = date.ToDateTime(workStart, DateTimeKind.Utc);
        var end = date.ToDateTime(workEnd, DateTimeKind.Utc);

        while (current.Add(TimeSpan.FromMinutes(service.DurationMinutes)) <= end)
        {
            var slotEnd = current.AddMinutes(service.DurationMinutes);
            var isAvailable = !busySlots.Any(b =>
                b.StartTime < new DateTimeOffset(slotEnd) &&
                b.EndTime > new DateTimeOffset(current));

            slots.Add(new TimeSlotDto(
                new DateTimeOffset(current, TimeSpan.Zero),
                new DateTimeOffset(slotEnd, TimeSpan.Zero),
                isAvailable));

            current = current.Add(slotDuration);
        }

        return slots;
    }

    private async Task<List<(DateTimeOffset StartTime, DateTimeOffset EndTime)>> GetBusySlotsAsync(
        Guid employeeId, Service service, DateOnly date, Guid tenantId,
        CancellationToken cancellationToken)
    {
        var dayStart = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var busySlots = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.EmployeeId == employeeId
                     && a.Status != AppointmentStatus.Cancelled
                     && a.StartTime >= dayStart
                     && a.EndTime <= dayEnd)
            .Select(a => new { a.StartTime, a.EndTime })
            .ToListAsync(cancellationToken);

        return busySlots
            .Select(b => (b.StartTime, b.EndTime))
            .ToList();
    }
}
