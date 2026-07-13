using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Employees.Queries.GetEmployeeSchedules;

public record GetEmployeeSchedulesQuery(Guid EmployeeId) : IRequest<List<ScheduleDto>>;

public record ScheduleDto(
    Guid Id,
    Guid EmployeeId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsActive);

public sealed class GetEmployeeSchedulesQueryHandler : IRequestHandler<GetEmployeeSchedulesQuery, List<ScheduleDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetEmployeeSchedulesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<ScheduleDto>> Handle(GetEmployeeSchedulesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Schedules
            .AsNoTracking()
            .Where(s => s.EmployeeId == request.EmployeeId && s.TenantId == _tenantService.TenantId)
            .OrderBy(s => s.DayOfWeek)
            .Select(s => new ScheduleDto(s.Id, s.EmployeeId, s.DayOfWeek, s.StartTime, s.EndTime, s.IsActive))
            .ToListAsync(cancellationToken);
    }
}
