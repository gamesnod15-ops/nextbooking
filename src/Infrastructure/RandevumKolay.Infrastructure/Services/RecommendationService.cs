using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Infrastructure.Services;

public class RecommendationService : IRecommendationService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        IApplicationDbContext context,
        ILogger<RecommendationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<CustomerRecommendation>> GetServiceRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default)
    {
        var existing = await _context.CustomerRecommendations
            .AsNoTracking()
            .Include(r => r.RecommendedService)
            .Where(r => r.TenantId == tenantId
                     && r.CustomerId == customerId
                     && r.RecommendationType == RecommendationType.Service
                     && !r.IsDeleted
                     && (r.ExpiresAt == null || r.ExpiresAt > DateTimeOffset.UtcNow))
            .OrderByDescending(r => r.RelevanceScore)
            .Take(count)
            .ToListAsync(ct);

        if (existing.Count > 0)
            return existing;

        var recommendations = await GenerateServiceRecommendationsAsync(tenantId, customerId, count, ct);
        await StoreRecommendationsAsync(recommendations, ct);
        return recommendations;
    }

    public async Task<List<CustomerRecommendation>> GetProductRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default)
    {
        var existing = await _context.CustomerRecommendations
            .AsNoTracking()
            .Include(r => r.RecommendedProduct)
            .Where(r => r.TenantId == tenantId
                     && r.CustomerId == customerId
                     && r.RecommendationType == RecommendationType.Product
                     && !r.IsDeleted
                     && (r.ExpiresAt == null || r.ExpiresAt > DateTimeOffset.UtcNow))
            .OrderByDescending(r => r.RelevanceScore)
            .Take(count)
            .ToListAsync(ct);

        if (existing.Count > 0)
            return existing;

        var recommendations = await GenerateProductRecommendationsAsync(tenantId, customerId, count, ct);
        await StoreRecommendationsAsync(recommendations, ct);
        return recommendations;
    }

    public async Task<List<CustomerRecommendation>> GetTimelyRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 5, CancellationToken ct = default)
    {
        var recommendations = new List<CustomerRecommendation>();

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null) return recommendations;

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                     && a.CustomerId == customerId
                     && a.Status == AppointmentStatus.Completed
                     && !a.IsDeleted)
            .Include(a => a.Service)
            .OrderByDescending(a => a.StartTime)
            .Take(20)
            .ToListAsync(ct);

        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.StockQuantity > 0)
            .ToListAsync(ct);

        var serviceUsage = appointments
            .GroupBy(a => a.ServiceId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var serviceGroup in serviceUsage)
        {
            var lastAppointment = serviceGroup.Value.First();
            var service = lastAppointment.Service;
            if (service is null) continue;

            var daysSinceLastVisit = (DateTimeOffset.UtcNow - lastAppointment.StartTime).TotalDays;
            var typicalInterval = GetTypicalReturnDays(service.Name);

            if (daysSinceLastVisit >= typicalInterval * 0.8 && daysSinceLastVisit <= typicalInterval * 1.5)
            {
                var recommendation = CustomerRecommendation.Create(
                    tenantId, customerId, RecommendationType.Timely,
                    $"{service.Name} Zamanı Geldi",
                    $"{customer.Name} için {service.Name} hizmetinin zamanı geldi. Son ziyaretinizin üzerinden {(int)daysSinceLastVisit} gün geçti.",
                    0.9m,
                    $"Son ziyaret: {(int)daysSinceLastVisit} gün önce (genellikle her {typicalInterval} günde bir yapılır)",
                    serviceId: service.Id,
                    expiresAt: DateTimeOffset.UtcNow.AddDays(7));
                recommendations.Add(recommendation);
            }
        }

        var crossSellRecommendations = GenerateCrossSellRecommendations(
            tenantId, customerId, appointments, products, ct);
        recommendations.AddRange(crossSellRecommendations);

        return recommendations
            .OrderByDescending(r => r.RelevanceScore)
            .Take(count)
            .ToList();
    }

    public async Task<List<CustomerRecommendation>> GetAllRecommendationsAsync(
        Guid tenantId, Guid customerId, int count = 10, CancellationToken ct = default)
    {
        var existing = await _context.CustomerRecommendations
            .AsNoTracking()
            .Include(r => r.RecommendedService)
            .Include(r => r.RecommendedProduct)
            .Where(r => r.TenantId == tenantId
                     && r.CustomerId == customerId
                     && !r.IsDeleted
                     && (r.ExpiresAt == null || r.ExpiresAt > DateTimeOffset.UtcNow))
            .OrderByDescending(r => r.RelevanceScore)
            .Take(count)
            .ToListAsync(ct);

        if (existing.Count > 0)
            return existing;

        var all = new List<CustomerRecommendation>();
        all.AddRange(await GenerateServiceRecommendationsAsync(tenantId, customerId, 3, ct));
        all.AddRange(await GenerateProductRecommendationsAsync(tenantId, customerId, 3, ct));
        all.AddRange(await GetTimelyRecommendationsAsync(tenantId, customerId, 4, ct));
        await StoreRecommendationsAsync(all, ct);
        return all.OrderByDescending(r => r.RelevanceScore).Take(count).ToList();
    }

    public async Task GenerateAndStoreRecommendationsAsync(
        Guid tenantId, Guid customerId, CancellationToken ct = default)
    {
        var all = new List<CustomerRecommendation>();
        all.AddRange(await GenerateServiceRecommendationsAsync(tenantId, customerId, 5, ct));
        all.AddRange(await GenerateProductRecommendationsAsync(tenantId, customerId, 3, ct));
        all.AddRange(await GetTimelyRecommendationsAsync(tenantId, customerId, 2, ct));
        await StoreRecommendationsAsync(all, ct);
    }

    private async Task<List<CustomerRecommendation>> GenerateServiceRecommendationsAsync(
        Guid tenantId, Guid customerId, int count, CancellationToken ct)
    {
        var recommendations = new List<CustomerRecommendation>();

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);
        if (customer is null) return recommendations;

        var pastServiceIds = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId && a.CustomerId == customerId && a.Status == AppointmentStatus.Completed && !a.IsDeleted)
            .Select(a => a.ServiceId)
            .Distinct()
            .ToListAsync(ct);

        var allServices = await _context.Services
            .AsNoTracking()
            .Where(s => s.TenantId == tenantId && s.IsActive && !s.IsDeleted)
            .ToListAsync(ct);

        var notUsedServices = allServices
            .Where(s => !pastServiceIds.Contains(s.Id))
            .ToList();

        if (pastServiceIds.Count > 0)
        {
            var crossSellMap = GetCrossSellServiceMap();
            var suggestedIds = new HashSet<Guid>();

            foreach (var pastId in pastServiceIds)
            {
                if (crossSellMap.TryGetValue(pastId, out var suggested))
                {
                    foreach (var sid in suggested)
                    {
                        if (!suggestedIds.Contains(sid) && (notUsedServices.Any(s => s.Id == sid) || allServices.Any(s => s.Id == sid)))
                        {
                            suggestedIds.Add(sid);
                        }
                    }
                }
            }

            foreach (var sid in suggestedIds.Take(count))
            {
                var service = allServices.FirstOrDefault(s => s.Id == sid);
                if (service is null) continue;

                recommendations.Add(CustomerRecommendation.Create(
                    tenantId, customerId, RecommendationType.CrossSell,
                    $"{service.Name} ile Tamamlayın",
                    $"Son randevularınıza göre {service.Name} hizmeti de ilginizi çekebilir.",
                    0.8m,
                    "Sık kullanılan hizmetlerle birlikte tercih ediliyor",
                    serviceId: service.Id,
                    expiresAt: DateTimeOffset.UtcNow.AddDays(14)));
            }
        }

        foreach (var service in notUsedServices.Take(Math.Max(0, count - recommendations.Count)))
        {
            recommendations.Add(CustomerRecommendation.Create(
                tenantId, customerId, RecommendationType.Service,
                $"Yeni: {service.Name}",
                $"Henüz denemediğiniz {service.Name} hizmetini keşfedin.",
                0.5m,
                "Henüz kullanılmamış hizmet",
                serviceId: service.Id,
                expiresAt: DateTimeOffset.UtcNow.AddDays(30)));
        }

        return recommendations;
    }

    private async Task<List<CustomerRecommendation>> GenerateProductRecommendationsAsync(
        Guid tenantId, Guid customerId, int count, CancellationToken ct)
    {
        var recommendations = new List<CustomerRecommendation>();

        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.StockQuantity > 0)
            .ToListAsync(ct);

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);
        if (customer is null) return recommendations;

        var completedAppointments = await _context.Appointments
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId && a.CustomerId == customerId && a.Status == AppointmentStatus.Completed && !a.IsDeleted)
            .Include(a => a.Service)
            .OrderByDescending(a => a.StartTime)
            .Take(5)
            .ToListAsync(ct);

        var usedServiceNames = completedAppointments
            .Select(a => a.Service?.Name ?? "")
            .Where(n => !string.IsNullOrEmpty(n))
            .ToHashSet();

        var productServiceMap = GetProductServiceMap();

        foreach (var product in products)
        {
            if (productServiceMap.TryGetValue(product.Id, out var relatedServices))
            {
                if (relatedServices.Any(rs => usedServiceNames.Any(us => us.Contains(rs, StringComparison.OrdinalIgnoreCase))))
                {
                    recommendations.Add(CustomerRecommendation.Create(
                        tenantId, customerId, RecommendationType.Product,
                        $"{product.Name} İlginizi Çekebilir",
                        $"Aldığınız hizmetlerle uyumlu {product.Name} ürününü öneriyoruz.",
                        0.75m,
                        "Hizmet geçmişinize göre önerildi",
                        productId: product.Id,
                        expiresAt: DateTimeOffset.UtcNow.AddDays(14)));
                }
            }
        }

        if (recommendations.Count < count)
        {
            foreach (var product in products.Take(count - recommendations.Count))
            {
                if (!recommendations.Any(r => r.RecommendedProductId == product.Id))
                {
                    recommendations.Add(CustomerRecommendation.Create(
                        tenantId, customerId, RecommendationType.Product,
                        $"{product.Name}",
                        $"Stoklarımızda bulunan {product.Name} ürününü inceleyin.",
                        0.4m,
                        "Popüler ürün",
                        productId: product.Id,
                        expiresAt: DateTimeOffset.UtcNow.AddDays(30)));
                }
            }
        }

        return recommendations;
    }

    private List<CustomerRecommendation> GenerateCrossSellRecommendations(
        Guid tenantId, Guid customerId, List<Appointment> appointments,
        List<Product> products, CancellationToken ct)
    {
        var recommendations = new List<CustomerRecommendation>();

        if (appointments.Count == 0) return recommendations;

        var lastService = appointments.First().Service;
        if (lastService is null) return recommendations;

        var seasonalRecommendation = GetSeasonalRecommendation(tenantId, customerId);
        if (seasonalRecommendation is not null)
            recommendations.Add(seasonalRecommendation);

        return recommendations;
    }

    private async Task StoreRecommendationsAsync(
        List<CustomerRecommendation> recommendations, CancellationToken ct)
    {
        foreach (var recommendation in recommendations)
        {
            _context.CustomerRecommendations.Add(recommendation);
        }
        await _context.SaveChangesAsync(ct);
    }

    private static int GetTypicalReturnDays(string serviceName)
    {
        var lower = serviceName.ToLowerInvariant();
        if (lower.Contains("saç") || lower.Contains("kesim") || lower.Contains("tıraş"))
            return 30;
        if (lower.Contains("sakal") || lower.Contains("kaş"))
            return 14;
        if (lower.Contains("cilt") || lower.Contains("bakım") || lower.Contains("peeling"))
            return 30;
        if (lower.Contains("masaj") || lower.Contains("terapi"))
            return 20;
        if (lower.Contains("boya") || lower.Contains("renk") || lower.Contains("fön"))
            return 20;
        if (lower.Contains("manikür") || lower.Contains("pedikür") || lower.Contains("tırnak"))
            return 21;
        if (lower.Contains("lazer") || lower.Contains("epilasyon"))
            return 35;
        if (lower.Contains("dolgu") || lower.Contains("botoks") || lower.Contains("prp"))
            return 90;
        if (lower.Contains("diş") || lower.Contains("check-up"))
            return 180;
        return 45;
    }

    private static Dictionary<Guid, List<Guid>> GetCrossSellServiceMap()
    {
        var map = new Dictionary<Guid, List<Guid>>();
        return map;
    }

    private static Dictionary<Guid, List<string>> GetProductServiceMap()
    {
        var map = new Dictionary<Guid, List<string>>();
        return map;
    }

    private static CustomerRecommendation? GetSeasonalRecommendation(Guid tenantId, Guid customerId)
    {
        var month = DateTimeOffset.UtcNow.Month;
        string? title = null;
        string? desc = null;
        decimal score = 0.6m;

        (title, desc) = month switch
        {
            3 or 4 or 5 => ("Bahar Bakımı Zamanı", "Bahar aylarında cilt bakımı ve saç yenileme için harika bir dönem!"),
            6 or 7 or 8 => ("Yaz Hazırlığı", "Yaz aylarında epilasyon, cilt bakımı ve saç rengi yenileme önerilir."),
            9 or 10 or 11 => ("Sonbahar Bakımı", "Yaz sonrası saç ve cilt yenileme bakımları için doğru zaman."),
            12 or 1 or 2 => ("Kış Bakımı", "Soğuk havalarda saç ve cilt bakımınızı ihmal etmeyin!"),
            _ => (null, null)
        };

        if (title is null) return null;

        return CustomerRecommendation.Create(
            tenantId, customerId, RecommendationType.Seasonal,
            title, desc, score,
            "Mevsimsel öneri",
            expiresAt: DateTimeOffset.UtcNow.AddDays(14));
    }
}
