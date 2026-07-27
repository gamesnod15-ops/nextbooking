using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Customers.Commands.DeleteCustomer;

public record DeleteCustomerCommand(Guid Id) : IRequest;

public sealed class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public DeleteCustomerCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == request.Id && c.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new NotFoundException($"Customer {request.Id} not found.");

        var appointmentIds = await _context.Appointments
            .Where(a => a.CustomerId == customer.Id)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

        if (appointmentIds.Count > 0)
        {
            var noShowPredictions = await _context.NoShowPredictions
                .Where(p => appointmentIds.Contains(p.AppointmentId))
                .ToListAsync(cancellationToken);
            if (noShowPredictions.Count > 0)
                _context.NoShowPredictions.RemoveRange(noShowPredictions);

            var deposits = await _context.Deposits
                .Where(d => appointmentIds.Contains(d.AppointmentId))
                .ToListAsync(cancellationToken);
            if (deposits.Count > 0)
                _context.Deposits.RemoveRange(deposits);

            var appointments = await _context.Appointments
                .Where(a => a.CustomerId == customer.Id)
                .ToListAsync(cancellationToken);
            _context.Appointments.RemoveRange(appointments);
        }

        var recommendations = await _context.CustomerRecommendations
            .Where(r => r.CustomerId == customer.Id)
            .ToListAsync(cancellationToken);
        if (recommendations.Count > 0)
            _context.CustomerRecommendations.RemoveRange(recommendations);

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
