using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Dashboard;

/// <summary>Top-level KPIs shown on the manager panel's landing page.</summary>
public record GetAdminDashboardQuery : IRequest<AdminDashboardDto>;

public record AdminDashboardDto(
    int TotalTenants,
    int ActiveTenants,
    int TotalBusinessUsers,
    int TotalCustomerUsers,
    int NewUsersThisMonth,
    decimal RevenueThisMonth,
    decimal RevenueAllTime,
    int UnresolvedFeedbackCount);

public sealed class GetAdminDashboardQueryHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminDashboardDto> Handle(GetAdminDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

        var totalTenants = await _context.Tenants.AsNoTracking().CountAsync(cancellationToken);
        var activeTenants = await _context.Tenants.AsNoTracking().CountAsync(t => t.IsActive, cancellationToken);

        var totalBusinessUsers = await _context.Users.AsNoTracking()
            .CountAsync(u => u.Role == "tenant_admin" || u.Role == "employee", cancellationToken);
        var totalCustomerUsers = await _context.Users.AsNoTracking()
            .CountAsync(u => u.Role == "customer", cancellationToken);
        var newUsersThisMonth = await _context.Users.AsNoTracking()
            .CountAsync(u => u.CreatedAt >= monthStart, cancellationToken);

        var revenueThisMonth = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid && p.PaidAt >= monthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var revenueAllTime = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Paid)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        var unresolvedFeedbackCount = await _context.Feedbacks.AsNoTracking()
            .CountAsync(f => f.CreatedAt >= now.AddDays(-30), cancellationToken);

        return new AdminDashboardDto(
            totalTenants,
            activeTenants,
            totalBusinessUsers,
            totalCustomerUsers,
            newUsersThisMonth,
            revenueThisMonth,
            revenueAllTime,
            unresolvedFeedbackCount);
    }
}
