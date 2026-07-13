using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Employees.Commands.CreateEmployee;

public record CreateEmployeeCommand(
    string Name,
    string? Title,
    string? Bio,
    string? Email,
    string? Phone,
    bool AcceptsOnlineBookings,
    List<Guid>? ServiceIds) : IRequest<Guid>;

public sealed class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateEmployeeCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var business = await _context.Businesses
            .Where(b => b.TenantId == _tenantService.TenantId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        var employee = Employee.Create(
            _tenantService.TenantId,
            business.Id,
            request.Name,
            request.Title,
            request.Email,
            request.Phone);

        employee.Update(request.Name, request.Title, request.Bio, request.Phone, request.Email);

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Assign services
        if (request.ServiceIds?.Count > 0)
        {
            var validServiceIds = await _context.Services
                .Where(s => s.TenantId == _tenantService.TenantId && request.ServiceIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);

            foreach (var svcId in validServiceIds)
            {
                _context.EmployeeServices.Add(EmployeeService.Create(employee.Id, svcId));
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return employee.Id;
    }
}

public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).EmailAddress().When(x => x.Email is not null);
    }
}
