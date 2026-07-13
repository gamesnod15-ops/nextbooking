using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure.Services;

public class SmartNotificationService : ISmartNotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<SmartNotificationService> _logger;

    public SmartNotificationService(
        IApplicationDbContext context,
        INotificationService notificationService,
        ILogger<SmartNotificationService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<string> EnhanceReminderMessageAsync(
        Guid appointmentId, string baseMessage, CancellationToken ct = default)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, ct);

        if (appointment?.Customer is null)
            return baseMessage;

        var customer = appointment.Customer;
        var localTime = appointment.StartTime.ToString("dd.MM.yyyy HH:mm");
        var serviceName = appointment.Service?.Name ?? "";
        var employeeName = appointment.Employee?.Name ?? "";

        var dayOfWeek = appointment.StartTime.DayOfWeek switch
        {
            DayOfWeek.Monday => "Pazartesi",
            DayOfWeek.Tuesday => "Salı",
            DayOfWeek.Wednesday => "Çarşamba",
            DayOfWeek.Thursday => "Perşembe",
            DayOfWeek.Friday => "Cuma",
            DayOfWeek.Saturday => "Cumartesi",
            DayOfWeek.Sunday => "Pazar",
            _ => ""
        };

        var parts = new List<string>
        {
            $"Sayın {customer.Name}",
            $"{dayOfWeek} günü {localTime} saatindeki {serviceName} randevunuzu hatırlatmak isteriz."
        };

        var hoursUntilAppointment = (appointment.StartTime - DateTimeOffset.UtcNow).TotalHours;

        if (hoursUntilAppointment > 1 && hoursUntilAppointment <= 4)
        {
            parts.Add("Yola çıkmadan önce trafik durumunu kontrol etmeyi unutmayın.");
        }

        if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 2)
        {
            parts.Add(GetWeatherSuggestion());
        }

        if (!string.IsNullOrWhiteSpace(employeeName))
        {
            parts.Add($"Randevunuz {employeeName} tarafından gerçekleştirilecektir.");
        }

        parts.Add("İyi günler dileriz. - RandevumKolay");

        return string.Join(" ", parts);
    }

    public async Task SendSmartReminderAsync(
        Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == appointmentId, ct);

        if (appointment?.Customer is null) return;

        var optimalMinutes = await CalculateOptimalReminderMinutesAsync(appointmentId, ct);

        var minutesUntilAppointment = (appointment.StartTime - DateTimeOffset.UtcNow).TotalMinutes;

        if (minutesUntilAppointment <= optimalMinutes + 15 && minutesUntilAppointment >= optimalMinutes - 15)
        {
            await _notificationService.SendAppointmentReminderAsync(appointmentId, ct);
        }
    }

    public async Task<int> CalculateOptimalReminderMinutesAsync(
        Guid appointmentId, CancellationToken ct = default)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appointmentId, ct);

        if (appointment is null)
            return 1440;

        var dayOfWeek = appointment.StartTime.DayOfWeek;
        var hour = appointment.StartTime.Hour;

        if (dayOfWeek == DayOfWeek.Monday && hour < 10)
        {
            return 180;
        }

        if (hour < 10)
        {
            return 120;
        }

        return 1440;
    }

    private static string GetWeatherSuggestion()
    {
        var month = DateTimeOffset.UtcNow.Month;
        return month switch
        {
            12 or 1 or 2 => "Hava soğuk, yanınızda şemsiye almayı unutmayın.",
            6 or 7 or 8 => "Sıcak hava sebebiyle yanınızda su bulundurmanızı öneririz.",
            3 or 4 or 5 => "İlkbahar yağmurlarına karşı şemsiyenizi alın.",
            9 or 10 or 11 => "Mevsim geçişinde hava değişken olabilir, hazırlıklı olun.",
            _ => "Keyifli bir gün geçirmenizi dileriz."
        };
    }
}
