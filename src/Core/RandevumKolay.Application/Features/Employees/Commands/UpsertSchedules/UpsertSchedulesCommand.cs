using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Employees.Commands.UpsertSchedules;

public record ScheduleEntry(DayOfWeek DayOfWeek, string StartTime, string EndTime, bool IsActive);

public record UpsertSchedulesCommand(Guid EmployeeId, List<ScheduleEntry> Schedules) : IRequest;

public sealed class UpsertSchedulesCommandHandler : IRequestHandler<UpsertSchedulesCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpsertSchedulesCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpsertSchedulesCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Employee {request.EmployeeId} not found.");

        var existing = await _context.Schedules
            .Where(s => s.EmployeeId == request.EmployeeId && s.TenantId == _tenantService.TenantId)
            .ToListAsync(cancellationToken);

        _context.Schedules.RemoveRange(existing);

        foreach (var entry in request.Schedules)
        {
            var start = TimeOnly.Parse(entry.StartTime);
            var end = TimeOnly.Parse(entry.EndTime);
            if (end > start)
            {
                var schedule = Schedule.Create(_tenantService.TenantId, request.EmployeeId, entry.DayOfWeek, start, end);
                if (!entry.IsActive)
                    schedule.Update(start, end, false);
                _context.Schedules.Add(schedule);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
