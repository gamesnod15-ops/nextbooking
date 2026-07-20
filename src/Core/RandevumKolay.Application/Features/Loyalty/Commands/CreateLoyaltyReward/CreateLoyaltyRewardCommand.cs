using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Loyalty.Commands.CreateLoyaltyReward;

public record CreateLoyaltyRewardCommand(
    string Name,
    string? Description,
    int PointCost,
    LoyaltyRewardCategory Category) : IRequest<Guid>;

public sealed class CreateLoyaltyRewardCommandHandler : IRequestHandler<CreateLoyaltyRewardCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateLoyaltyRewardCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateLoyaltyRewardCommand request, CancellationToken cancellationToken)
    {
        var reward = LoyaltyReward.Create(
            _tenantService.TenantId, request.Name, request.Description, request.PointCost, request.Category);

        _context.LoyaltyRewards.Add(reward);
        await _context.SaveChangesAsync(cancellationToken);

        return reward.Id;
    }
}

public class CreateLoyaltyRewardCommandValidator : AbstractValidator<CreateLoyaltyRewardCommand>
{
    public CreateLoyaltyRewardCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PointCost).GreaterThan(0);
    }
}
