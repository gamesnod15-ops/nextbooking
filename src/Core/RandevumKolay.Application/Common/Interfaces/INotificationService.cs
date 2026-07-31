namespace RandevumKolay.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendAppointmentConfirmationAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task SendAppointmentReminderAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task SendWinBackMessageAsync(Guid customerId, string messageText, CancellationToken cancellationToken = default);
    Task SendRealtimeNotificationAsync(Guid tenantId, string eventName, object payload, CancellationToken cancellationToken = default);
    Task SendUserNotificationAsync(Guid userId, string eventName, object payload, CancellationToken cancellationToken = default);
    Task SendPushNotificationAsync(Guid tenantId, string title, string body, object? data = null, CancellationToken cancellationToken = default);
}
