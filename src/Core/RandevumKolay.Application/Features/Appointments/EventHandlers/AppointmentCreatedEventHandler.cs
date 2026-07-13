using MediatR;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Events;

namespace RandevumKolay.Application.Features.Appointments.EventHandlers;

public class AppointmentCreatedEventHandler : INotificationHandler<AppointmentCreatedEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IJobService _jobService;
    private readonly ILogger<AppointmentCreatedEventHandler> _logger;

    public AppointmentCreatedEventHandler(
        INotificationService notificationService,
        IJobService jobService,
        ILogger<AppointmentCreatedEventHandler> logger)
    {
        _notificationService = notificationService;
        _jobService = jobService;
        _logger = logger;
    }

    public async Task Handle(AppointmentCreatedEvent notification, CancellationToken cancellationToken)
    {
        var appointmentId = notification.Appointment.Id;

        _logger.LogInformation("Appointment created: {AppointmentId}", appointmentId);

        // Send confirmation async (fire-and-forget via job queue)
        _jobService.Enqueue<INotificationService>(
            svc => svc.SendAppointmentConfirmationAsync(appointmentId, CancellationToken.None));

        // Schedule reminder 24h before appointment
        var reminderTime = notification.Appointment.StartTime.AddHours(-24);
        if (reminderTime > DateTimeOffset.UtcNow)
        {
            _jobService.Schedule<INotificationService>(
                svc => svc.SendAppointmentReminderAsync(appointmentId, CancellationToken.None),
                reminderTime);
        }

        // Send realtime notification to tenant staff
        await _notificationService.SendRealtimeNotificationAsync(
            notification.Appointment.TenantId,
            "NewAppointment",
            new
            {
                appointmentId,
                customerName = notification.Appointment.Customer?.Name,
                startTime = notification.Appointment.StartTime
            },
            cancellationToken);
    }
}
