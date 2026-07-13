using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Campaigns.Commands.UpdateCampaign;

public record UpdateCampaignCommand(
    Guid Id,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    CampaignStatus Status,
    int? UsageLimit,
    List<Guid>? ApplicableServiceIds) : IRequest;

public sealed class UpdateCampaignCommandHandler : IRequestHandler<UpdateCampaignCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateCampaignCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
    {
        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Campaign {request.Id} not found.");

        campaign.Update(request.Name, request.Description, request.DiscountType,
            request.DiscountValue, request.StartDate, request.EndDate, request.UsageLimit);
        campaign.SetStatus(request.Status);

        if (request.ApplicableServiceIds is not null)
            campaign.SetApplicableServices(request.ApplicableServiceIds);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
