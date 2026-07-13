using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Customers.Commands.CreateCustomer;

public record CreateCustomerCommand(
    string Name,
    string Phone,
    string? Email,
    string? Notes,
    DateOnly? BirthDate,
    string? Gender) : IRequest<Guid>;

public sealed class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateCustomerCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.Customers
            .AnyAsync(c => c.TenantId == _tenantService.TenantId && c.Phone == request.Phone, cancellationToken);

        if (exists)
            throw new InvalidOperationException($"A customer with phone '{request.Phone}' already exists.");

        var customer = Customer.Create(_tenantService.TenantId, request.Name, request.Phone, request.Email);
        customer.Update(request.Name, request.Phone, request.Email, request.Notes, request.BirthDate);

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }
}

public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).EmailAddress().When(x => x.Email is not null);
    }
}
