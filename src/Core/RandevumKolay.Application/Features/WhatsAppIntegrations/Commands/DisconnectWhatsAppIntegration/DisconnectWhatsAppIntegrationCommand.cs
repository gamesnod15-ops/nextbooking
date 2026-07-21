using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppIntegrations.Commands.DisconnectWhatsAppIntegration;

public record DisconnectWhatsAppIntegrationCommand : IRequest;

public sealed class DisconnectWhatsAppIntegrationCommandHandler : IRequestHandler<DisconnectWhatsAppIntegrationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DisconnectWhatsAppIntegrationCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DisconnectWhatsAppIntegrationCommand request, CancellationToken cancellationToken)
    {
        var integration = await _context.WhatsAppIntegrations
            .FirstOrDefaultAsync(i => i.TenantId == _tenantService.TenantId, cancellationToken);

        integration?.Disconnect();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
