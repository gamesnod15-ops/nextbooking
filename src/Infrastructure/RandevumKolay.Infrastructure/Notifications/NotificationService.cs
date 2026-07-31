using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IHubContext<SignalR.NotificationHub> _hubContext;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IApplicationDbContext context,
        IEmailService emailService,
        IHubContext<SignalR.NotificationHub> hubContext,
        IHttpClientFactory httpClientFactory,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _hubContext = hubContext;
        _httpClientFactory = httpClientFactory;
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
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);

        if (appointment?.Customer is null || appointment.ReminderSent) return;

        appointment.MarkReminderSent();
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SendWinBackMessageAsync(
        Guid customerId,
        string messageText,
        CancellationToken cancellationToken = default)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);

        if (customer is null) return;

        var message = messageText.Replace("{customerName}", customer.Name);

        if (!string.IsNullOrWhiteSpace(customer.Email))
        {
            await _emailService.SendAsync(
                new EmailMessage(customer.Email, "Sizi Özledik!", $"<p>{message}</p>"),
                cancellationToken);
        }
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

    public async Task SendPushNotificationAsync(
        Guid tenantId,
        string title,
        string body,
        object? data = null,
        CancellationToken cancellationToken = default)
    {
    var tokens = await _context.PushTokens
        .Where(pt => pt.IsActive)
        .Where(pt => pt.UserId != null &&
            _context.Users.Any(u =>
                u.TenantId == tenantId &&
                u.Id == pt.UserId.Value &&
                u.IsActive))
        .Select(pt => pt.Token)
        .ToListAsync(cancellationToken);

        if (tokens.Count == 0) return;

        using var client = _httpClientFactory.CreateClient("ExpoPush");
        var messages = tokens.Select(token => new
        {
            to = token,
            title,
            body,
            data,
            sound = "default",
            priority = "high"
        });

        try
        {
            var response = await client.PostAsJsonAsync(
                "/--/api/v2/push/send",
                new { messages },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Expo push API returned {StatusCode}: {Body}",
                    response.StatusCode,
                    await response.Content.ReadAsStringAsync(cancellationToken));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Expo push notification for tenant {TenantId}", tenantId);
        }
    }
}
