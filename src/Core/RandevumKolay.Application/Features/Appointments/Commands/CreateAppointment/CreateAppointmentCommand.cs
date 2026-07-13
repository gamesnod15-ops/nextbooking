using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Appointments.Commands.CreateAppointment;

public record CreateAppointmentCommand(
    Guid ServiceId,
    Guid? EmployeeId,
    string Date,
    string Time,
    string FirstName,
    string LastName,
    string Phone,
    string Email,
    string? City = null,
    string? Notes = null,
    string Source = "web") : IRequest<Guid>;

public sealed class CreateAppointmentCommandHandler
    : IRequestHandler<CreateAppointmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IPublisher _publisher;

    public CreateAppointmentCommandHandler(
        IApplicationDbContext context,
        IPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
    }

    public async Task<Guid> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId
                                   && s.IsActive
                                   && !s.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Service), request.ServiceId);

        var tenantId = service.TenantId;
        var businessId = service.BusinessId;

        var employee = await ResolveEmployeeAsync(request, tenantId, businessId, service, cancellationToken);

        var phone = request.Phone.Replace(" ", "").Replace("-", "");
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Phone == phone
                                   && c.TenantId == tenantId
                                   && !c.IsDeleted, cancellationToken);

        if (customer is null)
        {
            customer = Customer.Create(tenantId, $"{request.FirstName} {request.LastName}", phone, request.Email);
            _context.Customers.Add(customer);
        }

        if (customer.IsBlocked)
            throw new ForbiddenAccessException("This customer is blocked from making appointments.");

        if (!DateOnly.TryParse(request.Date, out var parsedDate))
            throw new Common.Exceptions.ValidationException("Invalid date format.");

        if (!TimeOnly.TryParse(request.Time, out var parsedTime))
            throw new Common.Exceptions.ValidationException("Invalid time format.");

        var startTime = new DateTimeOffset(parsedDate.ToDateTime(parsedTime), TimeSpan.Zero);
        var endTime = startTime.AddMinutes(service.DurationMinutes);

        var hasConflict = await _context.Appointments
            .Where(a => a.TenantId == tenantId
                     && a.EmployeeId == employee.Id
                     && a.Status != AppointmentStatus.Cancelled
                     && a.StartTime < endTime
                     && a.EndTime > startTime)
            .AnyAsync(cancellationToken);

        if (hasConflict)
            throw new ConflictException("The selected time slot is not available.");

        var appointment = Appointment.Create(
            tenantId,
            businessId,
            request.ServiceId,
            employee.Id,
            customer.Id,
            startTime,
            endTime,
            service.Price,
            request.Notes,
            request.Source);

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var domainEvent in appointment.DomainEvents)
            await _publisher.Publish(domainEvent, cancellationToken);

        appointment.ClearDomainEvents();

        return appointment.Id;
    }

    private async Task<Employee> ResolveEmployeeAsync(
        CreateAppointmentCommand request,
        Guid tenantId,
        Guid businessId,
        Service service,
        CancellationToken cancellationToken)
    {
        if (request.EmployeeId.HasValue)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId.Value
                                       && e.TenantId == tenantId
                                       && e.IsActive
                                       && !e.IsDeleted, cancellationToken)
                ?? throw new NotFoundException(nameof(Employee), request.EmployeeId.Value);
        }

        var employees = await _context.Employees
            .Where(e => e.TenantId == tenantId
                     && e.BusinessId == businessId
                     && e.IsActive
                     && e.AcceptsOnlineBookings
                     && !e.IsDeleted)
            .ToListAsync(cancellationToken);

        if (employees.Count == 0)
        {
            return await GetOrCreateOwnerEmployeeAsync(tenantId, businessId, cancellationToken);
        }

        if (employees.Count == 1)
        {
            return employees[0];
        }

        if (!DateOnly.TryParse(request.Date, out var parsedDate) ||
            !TimeOnly.TryParse(request.Time, out var parsedTime))
        {
            return employees[0];
        }

        var startTime = new DateTimeOffset(parsedDate.ToDateTime(parsedTime), TimeSpan.Zero);
        var endTime = startTime.AddMinutes(service.DurationMinutes);

        var busyEmployeeIds = await _context.Appointments
            .Where(a => a.TenantId == tenantId
                     && a.BusinessId == businessId
                     && a.Status != AppointmentStatus.Cancelled
                     && a.StartTime < endTime
                     && a.EndTime > startTime
                     && employees.Select(e => e.Id).Contains(a.EmployeeId))
            .Select(a => a.EmployeeId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var available = employees.FirstOrDefault(e => !busyEmployeeIds.Contains(e.Id));

        return available ?? throw new ConflictException(
            "Tüm çalışanlar seçilen zaman diliminde dolu. Lütfen başka bir saat veya gün seçin.");
    }

    private async Task<Employee> GetOrCreateOwnerEmployeeAsync(
        Guid tenantId, Guid businessId, CancellationToken cancellationToken)
    {
        var existing = await _context.Employees
            .FirstOrDefaultAsync(e => e.TenantId == tenantId
                                   && e.BusinessId == businessId
                                   && !e.IsDeleted, cancellationToken);
        if (existing is not null)
            return existing;

        var owner = await _context.Users
            .Where(u => u.TenantId == tenantId
                     && u.Role == "tenant_admin"
                     && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("İşletme sahibi bulunamadı.");

        var ownerEmployee = await _context.Employees
            .FirstOrDefaultAsync(e => e.TenantId == tenantId
                                   && e.BusinessId == businessId
                                   && e.UserId == owner.Id
                                   && !e.IsDeleted, cancellationToken);
        if (ownerEmployee is not null)
            return ownerEmployee;

        var employee = Employee.Create(
            tenantId, businessId, owner.FullName,
            email: owner.Email, phone: owner.Phone);
        employee.LinkUser(owner.Id);
        _context.Employees.Add(employee);
        return employee;
    }
}
