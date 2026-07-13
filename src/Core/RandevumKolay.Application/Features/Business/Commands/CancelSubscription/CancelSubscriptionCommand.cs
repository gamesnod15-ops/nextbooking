using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Business.Commands.CancelSubscription;

public record CancelSubscriptionCommand : IRequest;

public sealed class CancelSubscriptionCommandHandler : IRequestHandler<CancelSubscriptionCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CancelSubscriptionCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(CancelSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Tenant not found.");

        tenant.Deactivate();

        var users = await _context.Users
            .Where(u => u.TenantId == _tenantService.TenantId)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
            user.Deactivate();

        await _context.SaveChangesAsync(cancellationToken);
    }
}
