using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Business.Commands.UpdateBusinessSettings;

public record UpdateBusinessSettingsCommand(Dictionary<string, string> Settings) : IRequest;

public sealed class UpdateBusinessSettingsCommandHandler : IRequestHandler<UpdateBusinessSettingsCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateBusinessSettingsCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateBusinessSettingsCommand request, CancellationToken cancellationToken)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException("Business not found for tenant.");

        business.UpsertSettings(request.Settings);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
