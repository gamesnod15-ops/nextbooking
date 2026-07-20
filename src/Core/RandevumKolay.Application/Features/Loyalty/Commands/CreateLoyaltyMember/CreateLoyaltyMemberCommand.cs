using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Loyalty.Commands.CreateLoyaltyMember;

public record CreateLoyaltyMemberCommand(
    string Name,
    string Phone,
    int StartingPoints) : IRequest<Guid>;

public sealed class CreateLoyaltyMemberCommandHandler : IRequestHandler<CreateLoyaltyMemberCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateLoyaltyMemberCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateLoyaltyMemberCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantService.TenantId;
        var phone = request.Phone.Replace(" ", "").Replace("-", "");

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Phone == phone, cancellationToken);

        if (customer is null)
        {
            customer = Customer.Create(tenantId, request.Name, phone);
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var existingMember = await _context.LoyaltyMembers
            .FirstOrDefaultAsync(m => m.TenantId == tenantId && m.CustomerId == customer.Id, cancellationToken);
        if (existingMember is not null)
            throw new ConflictException("Bu müşteri zaten sadakat programı üyesi.");

        var member = LoyaltyMember.Create(tenantId, customer.Id, request.StartingPoints);
        _context.LoyaltyMembers.Add(member);
        await _context.SaveChangesAsync(cancellationToken);

        return member.Id;
    }
}

public class CreateLoyaltyMemberCommandValidator : AbstractValidator<CreateLoyaltyMemberCommand>
{
    public CreateLoyaltyMemberCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty();
        RuleFor(x => x.StartingPoints).GreaterThanOrEqualTo(0);
    }
}
