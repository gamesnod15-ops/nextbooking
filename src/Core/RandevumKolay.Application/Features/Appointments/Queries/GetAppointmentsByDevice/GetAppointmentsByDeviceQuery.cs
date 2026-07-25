using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Queries.GetAppointmentsByDevice;

/// <summary>
/// Looks up appointments by the booking device's locally-generated id, so a guest
/// customer (no account) can still see appointments they created on this device.
/// </summary>
public record GetAppointmentsByDeviceQuery(string DeviceId) : IRequest<List<DeviceAppointmentDto>>;

public record DeviceAppointmentDto(
    Guid Id,
    Guid BusinessId,
    string BusinessName,
    string ServiceName,
    int ServiceDurationMinutes,
    string EmployeeName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    AppointmentStatus Status,
    decimal Price,
    string Source);

public sealed class GetAppointmentsByDeviceQueryHandler
    : IRequestHandler<GetAppointmentsByDeviceQuery, List<DeviceAppointmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAppointmentsByDeviceQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<DeviceAppointmentDto>> Handle(
        GetAppointmentsByDeviceQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            return [];

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.DeviceId == request.DeviceId)
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .OrderByDescending(a => a.StartTime)
            .ToListAsync(cancellationToken);

        var businessIds = appointments.Select(a => a.BusinessId).Distinct().ToList();
        var businessNames = await _context.Businesses
            .AsNoTracking()
            .Where(b => businessIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Name, cancellationToken);

        return appointments
            .Select(a => new DeviceAppointmentDto(
                a.Id,
                a.BusinessId,
                businessNames.GetValueOrDefault(a.BusinessId, "İşletme"),
                a.Service!.Name,
                a.Service.DurationMinutes,
                a.Employee!.Name,
                a.StartTime,
                a.EndTime,
                a.Status,
                a.Price,
                a.Source))
            .ToList();
    }
}
