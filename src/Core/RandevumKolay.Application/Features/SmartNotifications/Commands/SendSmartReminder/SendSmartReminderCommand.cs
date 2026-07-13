using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.SmartNotifications.Commands.SendSmartReminder;

public record SendSmartReminderCommand(Guid AppointmentId) : IRequest;

public sealed class SendSmartReminderCommandHandler
    : IRequestHandler<SendSmartReminderCommand>
{
    private readonly ISmartNotificationService _smartNotificationService;

    public SendSmartReminderCommandHandler(ISmartNotificationService smartNotificationService)
    {
        _smartNotificationService = smartNotificationService;
    }

    public async Task Handle(SendSmartReminderCommand request, CancellationToken cancellationToken)
    {
        await _smartNotificationService.SendSmartReminderAsync(
            request.AppointmentId, cancellationToken);
    }
}
