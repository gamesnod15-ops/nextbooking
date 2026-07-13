namespace RandevumKolay.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendAppointmentConfirmationAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task SendAppointmentReminderAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task SendAppointmentCancellationAsync(Guid appointmentId, string reason, CancellationToken cancellationToken = default);
    Task SendRealtimeNotificationAsync(Guid tenantId, string eventName, object payload, CancellationToken cancellationToken = default);
    Task SendUserNotificationAsync(Guid userId, string eventName, object payload, CancellationToken cancellationToken = default);
}
