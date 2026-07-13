using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Employees.Commands.UpdateEmployee;

public record UpdateEmployeeCommand(
    Guid Id,
    string Name,
    string? Title,
    string? Bio,
    string? Phone,
    string? Email,
    bool IsActive,
    bool AcceptsOnlineBookings,
    List<Guid>? ServiceIds) : IRequest;

public sealed class UpdateEmployeeCommandHandler : IRequestHandler<UpdateEmployeeCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateEmployeeCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees
            .Include(e => e.EmployeeServices)
            .FirstOrDefaultAsync(e => e.Id == request.Id && e.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Employee {request.Id} not found.");

        employee.Update(request.Name, request.Title, request.Bio, request.Phone, request.Email);
        employee.SetActive(request.IsActive);

        // Sync services
        if (request.ServiceIds is not null)
        {
            var existing = employee.EmployeeServices.ToList();
            var toRemove = existing.Where(es => !request.ServiceIds.Contains(es.ServiceId)).ToList();
            var existingIds = existing.Select(es => es.ServiceId).ToList();
            var toAdd = request.ServiceIds.Where(id => !existingIds.Contains(id)).ToList();

            foreach (var es in toRemove)
                _context.EmployeeServices.Remove(es);

            var validServiceIds = await _context.Services
                .Where(s => s.TenantId == _tenantService.TenantId && toAdd.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);

            foreach (var svcId in validServiceIds)
                _context.EmployeeServices.Add(EmployeeService.Create(request.Id, svcId));
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdateEmployeeCommandValidator : AbstractValidator<UpdateEmployeeCommand>
{
    public UpdateEmployeeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).EmailAddress().When(x => x.Email is not null);
    }
}
