using MediatR;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Events;

namespace RandevumKolay.Application.Features.Appointments.EventHandlers;

public class AppointmentCancelledEventHandler : INotificationHandler<AppointmentCancelledEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IJobService _jobService;
    private readonly ILogger<AppointmentCancelledEventHandler> _logger;

    public AppointmentCancelledEventHandler(
        INotificationService notificationService,
        IJobService jobService,
        ILogger<AppointmentCancelledEventHandler> logger)
    {
        _notificationService = notificationService;
        _jobService = jobService;
        _logger = logger;
    }

    public async Task Handle(AppointmentCancelledEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Appointment cancelled: {AppointmentId}, Reason: {Reason}",
            notification.Appointment.Id, notification.Reason);

        _jobService.Enqueue<INotificationService>(
            svc => svc.SendAppointmentCancellationAsync(
                notification.Appointment.Id,
                notification.Reason,
                CancellationToken.None));

        await _notificationService.SendRealtimeNotificationAsync(
            notification.Appointment.TenantId,
            "AppointmentCancelled",
            new
            {
                appointmentId = notification.Appointment.Id,
                reason = notification.Reason
            },
            cancellationToken);
    }
}
