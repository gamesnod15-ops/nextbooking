using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppIntegrations.Queries.GetWhatsAppIntegrationStatus;

public record GetWhatsAppIntegrationStatusQuery : IRequest<WhatsAppIntegrationStatusDto>;

public record WhatsAppIntegrationStatusDto(bool IsConnected, string? PhoneNumberId, DateTimeOffset? ConnectedAt);

public sealed class GetWhatsAppIntegrationStatusQueryHandler
    : IRequestHandler<GetWhatsAppIntegrationStatusQuery, WhatsAppIntegrationStatusDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetWhatsAppIntegrationStatusQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<WhatsAppIntegrationStatusDto> Handle(GetWhatsAppIntegrationStatusQuery request, CancellationToken cancellationToken)
    {
        var integration = await _context.WhatsAppIntegrations
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.TenantId == _tenantService.TenantId, cancellationToken);

        return new WhatsAppIntegrationStatusDto(
            integration?.IsConnected ?? false,
            integration?.PhoneNumberId,
            integration?.ConnectedAt);
    }
}
