using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.WhatsAppIntegrations.Commands.ConnectWhatsAppIntegration;

public record ConnectWhatsAppIntegrationCommand(string PhoneNumberId, string AccessToken) : IRequest;

public sealed class ConnectWhatsAppIntegrationCommandHandler : IRequestHandler<ConnectWhatsAppIntegrationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public ConnectWhatsAppIntegrationCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(ConnectWhatsAppIntegrationCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;

        var integration = await _context.WhatsAppIntegrations
            .FirstOrDefaultAsync(i => i.TenantId == tenantId, cancellationToken);

        if (integration is null)
        {
            integration = Domain.Entities.WhatsAppIntegration.CreateDisconnected(tenantId);
            _context.WhatsAppIntegrations.Add(integration);
        }

        integration.Connect(request.PhoneNumberId, request.AccessToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class ConnectWhatsAppIntegrationCommandValidator : AbstractValidator<ConnectWhatsAppIntegrationCommand>
{
    public ConnectWhatsAppIntegrationCommandValidator()
    {
        RuleFor(x => x.PhoneNumberId).NotEmpty();
        RuleFor(x => x.AccessToken).NotEmpty();
    }
}
