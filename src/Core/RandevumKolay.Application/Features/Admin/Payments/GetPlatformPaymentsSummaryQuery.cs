using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Payments;

/// <summary>Totals for the manager panel's payments dashboard — grand total
/// and a breakdown per revenue type, counted only over paid entries.</summary>
public record GetPlatformPaymentsSummaryQuery : IRequest<PlatformPaymentsSummaryDto>;

public record PlatformPaymentTypeSummaryDto(PlatformPaymentType Type, decimal TotalAmount, int Count);

public record PlatformPaymentsSummaryDto(
    decimal TotalPaidAmount,
    decimal TotalPendingAmount,
    int TotalPaidCount,
    List<PlatformPaymentTypeSummaryDto> ByType);

public sealed class GetPlatformPaymentsSummaryQueryHandler : IRequestHandler<GetPlatformPaymentsSummaryQuery, PlatformPaymentsSummaryDto>
{
    private readonly IApplicationDbContext _context;

    public GetPlatformPaymentsSummaryQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PlatformPaymentsSummaryDto> Handle(GetPlatformPaymentsSummaryQuery request, CancellationToken cancellationToken)
    {
        var paid = _context.PlatformPayments.AsNoTracking().Where(p => p.Status == PlatformPaymentStatus.Paid);

        var totalPaidAmount = await paid.SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var totalPaidCount = await paid.CountAsync(cancellationToken);

        var totalPendingAmount = await _context.PlatformPayments.AsNoTracking()
            .Where(p => p.Status == PlatformPaymentStatus.Pending)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        var byType = await paid
            .GroupBy(p => p.Type)
            .Select(g => new PlatformPaymentTypeSummaryDto(g.Key, g.Sum(p => p.Amount), g.Count()))
            .ToListAsync(cancellationToken);

        foreach (var type in Enum.GetValues<PlatformPaymentType>())
        {
            if (!byType.Any(x => x.Type == type))
                byType.Add(new PlatformPaymentTypeSummaryDto(type, 0m, 0));
        }

        return new PlatformPaymentsSummaryDto(totalPaidAmount, totalPendingAmount, totalPaidCount, byType);
    }
}
