namespace RandevumKolay.Application.Common.Interfaces;

public interface ISmartNotificationService
{
    Task<string> EnhanceReminderMessageAsync(
        Guid appointmentId, string baseMessage, CancellationToken ct = default);

    Task SendSmartReminderAsync(
        Guid appointmentId, CancellationToken ct = default);

    Task<int> CalculateOptimalReminderMinutesAsync(
        Guid appointmentId, CancellationToken ct = default);
}
