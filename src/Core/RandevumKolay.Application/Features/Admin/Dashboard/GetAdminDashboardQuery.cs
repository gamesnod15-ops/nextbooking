using System.Globalization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Dashboard;

/// <summary>Top-level KPIs and chart data shown on the manager panel's landing page.</summary>
public record GetAdminDashboardQuery : IRequest<AdminDashboardDto>;

public record MonthlyPointDto(string Label, decimal Value);
public record PaymentTypeBreakdownDto(PlatformPaymentType Type, decimal Amount, int Count);

public record AdminDashboardDto(
    int TotalTenants,
    int ActiveTenants,
    int TotalBusinessUsers,
    int TotalCustomerUsers,
    int TotalCustomers,
    int TotalEmployees,
    int TotalPayments,
    int NewUsersThisMonth,
    decimal RevenueThisMonth,
    decimal RevenueAllTime,
    int UnresolvedFeedbackCount,
    List<MonthlyPointDto> MonthlyRevenue,
    List<MonthlyPointDto> TenantGrowth,
    List<PaymentTypeBreakdownDto> PaymentsByType);

public sealed class GetAdminDashboardQueryHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminDashboardDto> Handle(GetAdminDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var sixMonthsAgo = monthStart.AddMonths(-5);
        var tr = new CultureInfo("tr-TR");

        var totalTenants = await _context.Tenants.AsNoTracking().CountAsync(cancellationToken);
        var activeTenants = await _context.Tenants.AsNoTracking().CountAsync(t => t.IsActive, cancellationToken);

        var totalBusinessUsers = await _context.Users.AsNoTracking()
            .CountAsync(u => u.Role == "tenant_admin" || u.Role == "employee", cancellationToken);
        var totalCustomerUsers = await _context.Users.AsNoTracking()
            .CountAsync(u => u.Role == "customer", cancellationToken);
        var newUsersThisMonth = await _context.Users.AsNoTracking()
            .CountAsync(u => u.CreatedAt >= monthStart, cancellationToken);

        var totalCustomers = await _context.Customers.AsNoTracking().CountAsync(cancellationToken);
        var totalEmployees = await _context.Employees.AsNoTracking().CountAsync(cancellationToken);
        var totalPayments = await _context.PlatformPayments.AsNoTracking().CountAsync(cancellationToken);

        var revenueThisMonth = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid && p.PaidAt >= monthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var revenueAllTime = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        var unresolvedFeedbackCount = await _context.Feedbacks.AsNoTracking()
            .CountAsync(f => f.CreatedAt >= now.AddDays(-30), cancellationToken);

        // Last 6 months' worth of raw rows, aggregated in-memory — avoids relying
        // on Postgres date-trunc translation for a handful of rows per tenant.
        var recentPayments = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid && p.PaidAt != null && p.PaidAt >= sixMonthsAgo)
            .Select(p => new { p.PaidAt, p.Amount })
            .ToListAsync(cancellationToken);

        var recentTenants = await _context.Tenants.AsNoTracking()
            .Where(t => t.CreatedAt >= sixMonthsAgo)
            .Select(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var monthlyRevenue = new List<MonthlyPointDto>();
        var tenantGrowth = new List<MonthlyPointDto>();
        for (var i = 0; i < 6; i++)
        {
            var month = sixMonthsAgo.AddMonths(i);
            var label = month.ToString("MMM yyyy", tr);

            var revenue = recentPayments
                .Where(p => p.PaidAt!.Value.Year == month.Year && p.PaidAt.Value.Month == month.Month)
                .Sum(p => p.Amount);
            monthlyRevenue.Add(new MonthlyPointDto(label, revenue));

            var newTenants = recentTenants.Count(t => t.Year == month.Year && t.Month == month.Month);
            tenantGrowth.Add(new MonthlyPointDto(label, newTenants));
        }

        var paymentsByType = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid)
            .GroupBy(p => p.Type)
            .Select(g => new PaymentTypeBreakdownDto(g.Key, g.Sum(p => p.Amount), g.Count()))
            .ToListAsync(cancellationToken);

        return new AdminDashboardDto(
            totalTenants,
            activeTenants,
            totalBusinessUsers,
            totalCustomerUsers,
            totalCustomers,
            totalEmployees,
            totalPayments,
            newUsersThisMonth,
            revenueThisMonth,
            revenueAllTime,
            unresolvedFeedbackCount,
            monthlyRevenue,
            tenantGrowth,
            paymentsByType);
    }
}
