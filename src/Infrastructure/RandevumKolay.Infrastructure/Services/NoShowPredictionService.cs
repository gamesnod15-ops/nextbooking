using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Infrastructure.Services;

public class NoShowPredictionService : INoShowPredictionService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<NoShowPredictionService> _logger;

    public NoShowPredictionService(
        IApplicationDbContext context,
        ILogger<NoShowPredictionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<NoShowPredictionResult> PredictNoShowAsync(
        Guid tenantId, Guid appointmentId, Guid customerId, CancellationToken ct = default)
    {
        var appointment = await _context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appointmentId, ct);

        if (appointment is null)
            return DefaultResult();

        return await PredictNoShowInternalAsync(tenantId, appointment, customerId, ct);
    }

    public async Task<NoShowPredictionResult> PredictNoShowForAppointmentAsync(
        Guid tenantId, DateTimeOffset appointmentStart, Guid customerId,
        Guid? serviceId = null, CancellationToken ct = default)
    {
        var factors = new List<string>();
        var probability = 0.05m;

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null)
            return DefaultResult();

        var pastAppointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.CustomerId == customerId
                     && !a.IsDeleted)
            .ToListAsync(ct);

        probability += CalculateCustomerHistoryFactor(customer, pastAppointments, factors);
        probability += CalculateTimingFactor(appointmentStart, factors);
        probability += CalculateLeadTimeFactor(appointmentStart, factors);
        probability += CalculateServiceFactor(serviceId, ct, factors);

        probability = Math.Clamp(probability, 0.01m, 0.95m);

        var riskLevel = GetRiskLevel(probability);
        var requiresDeposit = probability >= 0.3m;
        decimal? recommendedAmount = requiresDeposit
            ? CalculateRecommendedDeposit(probability)
            : null;

        await SavePredictionAsync(tenantId, null, customerId, probability, riskLevel,
            string.Join("; ", factors), requiresDeposit, recommendedAmount, ct);

        return new NoShowPredictionResult(probability, riskLevel, requiresDeposit, recommendedAmount,
            string.Join("; ", factors));
    }

    public async Task UpdateActualOutcomeAsync(Guid predictionId, bool noShow, CancellationToken ct = default)
    {
        var prediction = await _context.NoShowPredictions
            .FirstOrDefaultAsync(p => p.Id == predictionId, ct);

        if (prediction is not null)
        {
            prediction.MarkActualNoShow(noShow);
            await _context.SaveChangesAsync(ct);
        }
    }

    private async Task<NoShowPredictionResult> PredictNoShowInternalAsync(
        Guid tenantId, Appointment appointment, Guid customerId, CancellationToken ct)
    {
        var factors = new List<string>();
        var probability = 0.05m;

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null)
            return DefaultResult();

        var pastAppointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.CustomerId == customerId
                     && !a.IsDeleted)
            .ToListAsync(ct);

        probability += CalculateCustomerHistoryFactor(customer, pastAppointments, factors);
        probability += CalculateTimingFactor(appointment.StartTime, factors);
        probability += CalculateLeadTimeFactor(appointment.StartTime, factors);
        probability += CalculateServiceFactor(appointment.ServiceId, ct, factors);

        probability = Math.Clamp(probability, 0.01m, 0.95m);

        var riskLevel = GetRiskLevel(probability);
        var requiresDeposit = probability >= 0.3m;
        decimal? recommendedAmount = requiresDeposit
            ? CalculateRecommendedDeposit(probability)
            : null;

        await SavePredictionAsync(tenantId, appointment.Id, customerId, probability, riskLevel,
            string.Join("; ", factors), requiresDeposit, recommendedAmount, ct);

        return new NoShowPredictionResult(probability, riskLevel, requiresDeposit, recommendedAmount,
            string.Join("; ", factors));
    }

    private decimal CalculateCustomerHistoryFactor(Customer customer, List<Appointment> pastAppointments, List<string> factors)
    {
        decimal factor = 0;

        var totalAppointments = pastAppointments.Count;
        var cancelledCount = pastAppointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var noShowCount = pastAppointments.Count(a => a.Status == AppointmentStatus.NoShow);
        var completedCount = pastAppointments.Count(a => a.Status == AppointmentStatus.Completed);

        if (totalAppointments == 0)
        {
            factors.Add("Yeni müşteri (+%15)");
            return 0.15m;
        }

        if (totalAppointments > 0)
        {
            var noShowRate = (decimal)noShowCount / totalAppointments;
            if (noShowRate > 0.3m)
            {
                var penalty = noShowRate * 0.3m;
                factor += penalty;
                factors.Add($"Yüksek no-show geçmişi (%{noShowRate * 100:F0}) (+%{penalty * 100:F0})");
            }

            var cancelRate = (decimal)cancelledCount / totalAppointments;
            if (cancelRate > 0.2m)
            {
                var penalty = cancelRate * 0.2m;
                factor += penalty;
                factors.Add($"Yüksek iptal geçmişi (%{cancelRate * 100:F0}) (+%{penalty * 100:F0})");
            }
        }

        if (completedCount >= 5)
        {
            factor -= 0.05m;
            factors.Add("Sadık müşteri (-%5)");
        }

        if (customer.TotalVisits > 10)
        {
            factor -= 0.03m;
            factors.Add("Çok ziyaret eden müşteri (-%3)");
        }

        return factor;
    }

    private static decimal CalculateTimingFactor(DateTimeOffset appointmentStart, List<string> factors)
    {
        decimal factor = 0;
        var localTime = appointmentStart.TimeOfDay;

        if (localTime.Hours < 9)
        {
            factor += 0.08m;
            factors.Add("Erken saat (08:00 öncesi) (+%8)");
        }
        else if (localTime.Hours >= 12 && localTime.Hours < 14)
        {
            factor += 0.05m;
            factors.Add("Öğle saati (+%5)");
        }

        var dayOfWeek = appointmentStart.DayOfWeek;
        if (dayOfWeek == DayOfWeek.Monday)
        {
            factor += 0.06m;
            factors.Add("Pazartesi günü (+%6)");
        }

        return factor;
    }

    private static decimal CalculateLeadTimeFactor(DateTimeOffset appointmentStart, List<string> factors)
    {
        var daysUntilAppointment = (appointmentStart - DateTimeOffset.UtcNow).TotalDays;

        if (daysUntilAppointment > 14)
        {
            factors.Add("Uzun süre sonrası randevu (+%10)");
            return 0.10m;
        }
        if (daysUntilAppointment <= 1 && daysUntilAppointment > 0)
        {
            factors.Add("Kısa süre kala randevu (-%5)");
            return -0.05m;
        }

        return 0;
    }

    private decimal CalculateServiceFactor(Guid? serviceId, CancellationToken ct, List<string> factors)
    {
        if (serviceId is null) return 0;

        var serviceNoShowRate = GetServiceNoShowRate(serviceId.Value);
        if (serviceNoShowRate > 0.15m)
        {
            factors.Add($"Hizmet no-show oranı yüksek (%{serviceNoShowRate * 100:F0})");
            return serviceNoShowRate * 0.2m;
        }

        return 0;
    }

    private decimal GetServiceNoShowRate(Guid serviceId)
    {
        var appointments = _context.Appointments
            .AsNoTracking()
            .Where(a => a.ServiceId == serviceId && !a.IsDeleted)
            .ToList();

        if (appointments.Count == 0) return 0;
        return (decimal)appointments.Count(a => a.Status == AppointmentStatus.NoShow) / appointments.Count;
    }

    private static string GetRiskLevel(decimal probability)
    {
        return probability switch
        {
            < 0.15m => "Düşük",
            < 0.30m => "Orta",
            < 0.50m => "Yüksek",
            _ => "Çok Yüksek"
        };
    }

    private static decimal CalculateRecommendedDeposit(decimal probability)
    {
        return probability switch
        {
            < 0.30m => 0,
            < 0.50m => 50,
            < 0.70m => 100,
            _ => 200
        };
    }

    private async Task SavePredictionAsync(
        Guid tenantId, Guid? appointmentId, Guid customerId,
        decimal probability, string riskLevel, string factors,
        bool requiresDeposit, decimal? recommendedAmount, CancellationToken ct)
    {
        if (appointmentId is null) return;

        var prediction = NoShowPrediction.Create(
            tenantId, appointmentId.Value, customerId,
            probability, riskLevel, factors, requiresDeposit, recommendedAmount);

        _context.NoShowPredictions.Add(prediction);
        await _context.SaveChangesAsync(ct);
    }

    private static NoShowPredictionResult DefaultResult()
    {
        return new NoShowPredictionResult(0.1m, "Düşük", false, null, null);
    }
}
