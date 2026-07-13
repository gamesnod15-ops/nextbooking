using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Campaigns.Commands.CreateCampaign;

public record CreateCampaignCommand(
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int? UsageLimit,
    List<Guid>? ApplicableServiceIds) : IRequest<Guid>;

public sealed class CreateCampaignCommandHandler : IRequestHandler<CreateCampaignCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateCampaignCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
        var campaign = Campaign.Create(
            _tenantService.TenantId, request.Name, request.DiscountType,
            request.DiscountValue, request.StartDate, request.EndDate,
            request.Description, request.UsageLimit);

        if (request.ApplicableServiceIds?.Count > 0)
            campaign.SetApplicableServices(request.ApplicableServiceIds);

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync(cancellationToken);

        return campaign.Id;
    }
}

public class CreateCampaignCommandValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DiscountValue).GreaterThan(0);
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
    }
}
