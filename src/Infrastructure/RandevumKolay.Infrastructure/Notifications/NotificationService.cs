using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly IHubContext<SignalR.NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IApplicationDbContext context,
        IEmailService emailService,
        ISmsService smsService,
        IHubContext<SignalR.NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _smsService = smsService;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendAppointmentConfirmationAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment?.Customer is null) return;

        var customer = appointment.Customer;
        var localTime = appointment.StartTime.ToString("dd.MM.yyyy HH:mm");

        // Send SMS
        var smsMessage = $"Sayın {customer.Name}, {localTime} tarihindeki {appointment.Service?.Name} randevunuz onaylandı. İyi günler dileriz. - RandevumKolay";
        await _smsService.SendAsync(customer.Phone, smsMessage, cancellationToken);

        // Send Email if available
        if (!string.IsNullOrWhiteSpace(customer.Email))
        {
            var emailBody = $"""
                <h2>Randevunuz Onaylandı</h2>
                <p>Sayın {customer.Name},</p>
                <p>Aşağıdaki randevunuz başarıyla oluşturuldu:</p>
                <ul>
                    <li><strong>Hizmet:</strong> {appointment.Service?.Name}</li>
                    <li><strong>Uzman:</strong> {appointment.Employee?.Name}</li>
                    <li><strong>Tarih/Saat:</strong> {localTime}</li>
                    <li><strong>Ücret:</strong> {appointment.Price:F2} ₺</li>
                </ul>
                <p>İyi günler dileriz.</p>
                """;

            await _emailService.SendAsync(
                new EmailMessage(customer.Email, "Randevunuz Onaylandı - RandevumKolay", emailBody),
                cancellationToken);
        }
    }

    public async Task SendAppointmentReminderAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment?.Customer is null || appointment.ReminderSent) return;

        var customer = appointment.Customer;
        var localTime = appointment.StartTime.ToString("dd.MM.yyyy HH:mm");

        var message = $"Sayın {customer.Name}, yarın {localTime} saatindeki {appointment.Service?.Name} randevunuzu hatırlatmak istedik. - RandevumKolay";
        await _smsService.SendAsync(customer.Phone, message, cancellationToken);

        appointment.MarkReminderSent();
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SendAppointmentCancellationAsync(
        Guid appointmentId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment?.Customer is null) return;

        var customer = appointment.Customer;
        var localTime = appointment.StartTime.ToString("dd.MM.yyyy HH:mm");

        var message = $"Sayın {customer.Name}, {localTime} tarihindeki {appointment.Service?.Name} randevunuz iptal edilmiştir. Sebep: {reason}. - RandevumKolay";
        await _smsService.SendAsync(customer.Phone, message, cancellationToken);
    }

    public async Task SendRealtimeNotificationAsync(
        Guid tenantId,
        string eventName,
        object payload,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group($"tenant:{tenantId}")
            .SendAsync(eventName, payload, cancellationToken);
    }

    public async Task SendUserNotificationAsync(
        Guid userId,
        string eventName,
        object payload,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group($"user:{userId}")
            .SendAsync(eventName, payload, cancellationToken);
    }
}
