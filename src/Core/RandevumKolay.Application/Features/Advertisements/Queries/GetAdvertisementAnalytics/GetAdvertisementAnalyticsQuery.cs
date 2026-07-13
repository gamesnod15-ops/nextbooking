using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Advertisements.Queries.GetAdvertisementAnalytics;

public record GetAdvertisementAnalyticsQuery : IRequest<AdvertisementAnalyticsDto>;

public record DailyAdDataDto(string Date, int Impressions, int Clicks, int Conversions);
public record WeeklyAdDataDto(string Week, int Impressions, int Clicks);

public record AdvertisementAnalyticsDto(
    int TotalImpressions,
    int TotalClicks,
    int TotalConversions,
    double Ctr,
    double ConversionRate,
    List<DailyAdDataDto> DailyData,
    List<WeeklyAdDataDto> WeeklyData);

public sealed class GetAdvertisementAnalyticsQueryHandler
    : IRequestHandler<GetAdvertisementAnalyticsQuery, AdvertisementAnalyticsDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetAdvertisementAnalyticsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<AdvertisementAnalyticsDto> Handle(
        GetAdvertisementAnalyticsQuery request,
        CancellationToken cancellationToken)
    {
        var ads = await _context.Advertisements
            .AsNoTracking()
            .Where(a => a.TenantId == _tenantService.TenantId)
            .ToListAsync(cancellationToken);

        var totalImpressions = ads.Sum(a => a.Impressions);
        var totalClicks = ads.Sum(a => a.Clicks);
        var totalConversions = ads.Sum(a => a.Conversions);

        var ctr = totalImpressions > 0
            ? Math.Round((double)totalClicks / totalImpressions * 100, 2)
            : 0.0;

        var conversionRate = totalClicks > 0
            ? Math.Round((double)totalConversions / totalClicks * 100, 2)
            : 0.0;

        // Daily breakdown: aggregate per-ad totals distributed evenly across their duration
        // For a real-time system this would come from an event log table;
        // here we distribute each ad's metrics proportionally across its active days.
        var dailyData = BuildDailyData(ads);
        var weeklyData = BuildWeeklyData(dailyData);

        return new AdvertisementAnalyticsDto(
            totalImpressions,
            totalClicks,
            totalConversions,
            ctr,
            conversionRate,
            dailyData,
            weeklyData);
    }

    private static List<DailyAdDataDto> BuildDailyData(List<Domain.Entities.Advertisement> ads)
    {
        var result = new List<DailyAdDataDto>();
        var today = DateTimeOffset.UtcNow.Date;

        for (var i = 13; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var dayImpressions = 0;
            var dayClicks = 0;
            var dayConversions = 0;

            foreach (var ad in ads)
            {
                var adStart = ad.StartDate.UtcDateTime.Date;
                var adEnd = ad.EndDate.UtcDateTime.Date;
                if (date < adStart || date > adEnd) continue;

                var totalDays = Math.Max(1, (adEnd - adStart).Days + 1);
                dayImpressions += (int)Math.Round((double)ad.Impressions / totalDays);
                dayClicks += (int)Math.Round((double)ad.Clicks / totalDays);
                dayConversions += (int)Math.Round((double)ad.Conversions / totalDays);
            }

            result.Add(new DailyAdDataDto(
                date.ToString("dd MMM", System.Globalization.CultureInfo.GetCultureInfo("tr-TR")),
                dayImpressions,
                dayClicks,
                dayConversions));
        }

        return result;
    }

    private static List<WeeklyAdDataDto> BuildWeeklyData(List<DailyAdDataDto> daily)
    {
        var weeks = new List<WeeklyAdDataDto>();
        for (var w = 0; w < 4; w++)
        {
            var slice = daily.Skip(w * 7).Take(7).ToList();
            if (slice.Count == 0) break;
            weeks.Add(new WeeklyAdDataDto(
                $"{w + 1}. Hafta",
                slice.Sum(d => d.Impressions),
                slice.Sum(d => d.Clicks)));
        }
        return weeks;
    }
}
