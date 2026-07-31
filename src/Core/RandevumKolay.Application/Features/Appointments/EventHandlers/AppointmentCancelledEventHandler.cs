using MediatR;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Events;

namespace RandevumKolay.Application.Features.Appointments.EventHandlers;

public class AppointmentCancelledEventHandler : INotificationHandler<AppointmentCancelledEvent>
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<AppointmentCancelledEventHandler> _logger;

    public AppointmentCancelledEventHandler(
        INotificationService notificationService,
        ILogger<AppointmentCancelledEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(AppointmentCancelledEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Appointment cancelled: {AppointmentId}, Reason: {Reason}",
            notification.Appointment.Id, notification.Reason);

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
