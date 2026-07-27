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
            ?? throw new KeyNotFoundException($"Customer {request.Id} not found.");

        // Appointments.CustomerId has DeleteBehavior.Restrict, so deleting a customer
        // with appointment history throws an unhandled DbUpdateException that the
        // global middleware turns into a generic 500 ("An unexpected error occurred.").
        // Check up front and surface a clear, actionable message instead.
        var hasAppointments = await _context.Appointments
            .AnyAsync(a => a.CustomerId == customer.Id, cancellationToken);

        if (hasAppointments)
        {
            throw new ConflictException(
                "Bu müşterinin randevu geçmişi bulunduğu için silinemez. Müşteriyi engelleyebilirsiniz.");
        }

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
