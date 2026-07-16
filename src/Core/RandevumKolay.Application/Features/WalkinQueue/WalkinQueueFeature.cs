using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.WalkinQueue;

/// <summary>Walk-in queue (sıra yönetimi) — one queue per tenant's business.</summary>
public record QueueEntryDto(
    Guid Id,
    int Number,
    string CustomerName,
    string? CustomerPhone,
    string? ServiceName,
    string? EmployeeName,
    string Status,
    int WaitingMinutes,
    int EstimatedWait,
    DateTimeOffset? CalledAt,
    DateTimeOffset CreatedAt);

internal static class QueueMapping
{
    /// Mobile/panel use snake-ish lowercase status strings.
    public static string ToApi(this QueueStatus s) => s switch
    {
        QueueStatus.Waiting => "waiting",
        QueueStatus.InService => "in_service",
        QueueStatus.Completed => "completed",
        QueueStatus.Cancelled => "cancelled",
        _ => "no_show",
    };
}

// ── Query ────────────────────────────────────────────────────────────────────

public record GetQueueQuery : IRequest<List<QueueEntryDto>>;

public sealed class GetQueueQueryHandler : IRequestHandler<GetQueueQuery, List<QueueEntryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetQueueQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<List<QueueEntryDto>> Handle(GetQueueQuery request, CancellationToken ct)
    {
        var items = await _context.QueueItems.AsNoTracking()
            .Where(q => q.TenantId == _tenant.TenantId)
            .OrderBy(q => q.Status == QueueStatus.Waiting ? 0 : 1)
            .ThenBy(q => q.QueueNumber)
            .ToListAsync(ct);

        var serviceNames = await _context.Services.AsNoTracking()
            .Where(s => s.TenantId == _tenant.TenantId)
            .ToDictionaryAsync(s => s.Id, s => s.Name, ct);
        var employeeNames = await _context.Employees.AsNoTracking()
            .Where(e => e.TenantId == _tenant.TenantId)
            .ToDictionaryAsync(e => e.Id, e => e.Name, ct);

        var now = DateTimeOffset.UtcNow;
        return items.Select(q => new QueueEntryDto(
            q.Id,
            q.QueueNumber,
            q.CustomerName,
            q.CustomerPhone,
            q.ServiceId.HasValue && serviceNames.TryGetValue(q.ServiceId.Value, out var sn) ? sn : null,
            q.EmployeeId.HasValue && employeeNames.TryGetValue(q.EmployeeId.Value, out var en) ? en : null,
            q.Status.ToApi(),
            // Elapsed time since the customer joined — the UI shows a live counter.
            (int)Math.Max(0, (now - q.CreatedAt).TotalMinutes),
            q.EstimatedWaitMinutes,
            q.CalledAt,
            q.CreatedAt)).ToList();
    }
}

// ── Create ───────────────────────────────────────────────────────────────────

/// <param name="ServiceName">
/// Convenience for clients that only collect a free-text service/employee
/// (mobile). Matched against the tenant's records by name; ignored when the
/// explicit Id is supplied or no record matches.
/// </param>
public record AddQueueEntryCommand(
    string CustomerName,
    string? CustomerPhone,
    Guid? ServiceId,
    Guid? EmployeeId,
    int EstimatedWait = 0,
    string? ServiceName = null,
    string? EmployeeName = null) : IRequest<Guid>;

public sealed class AddQueueEntryCommandHandler : IRequestHandler<AddQueueEntryCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public AddQueueEntryCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(AddQueueEntryCommand request, CancellationToken ct)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenant.TenantId, ct)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        // Ticket numbers restart each day.
        var today = DateTimeOffset.UtcNow.Date;
        var lastNumber = await _context.QueueItems
            .Where(q => q.TenantId == _tenant.TenantId && q.CreatedAt >= today)
            .MaxAsync(q => (int?)q.QueueNumber, ct) ?? 0;

        var serviceId = request.ServiceId;
        if (serviceId is null && !string.IsNullOrWhiteSpace(request.ServiceName))
        {
            serviceId = (await _context.Services
                .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId
                                       && s.Name == request.ServiceName, ct))?.Id;
        }

        var employeeId = request.EmployeeId;
        if (employeeId is null && !string.IsNullOrWhiteSpace(request.EmployeeName))
        {
            employeeId = (await _context.Employees
                .FirstOrDefaultAsync(e => e.TenantId == _tenant.TenantId
                                       && e.Name == request.EmployeeName, ct))?.Id;
        }

        var item = QueueItem.Create(
            _tenant.TenantId, business.Id, lastNumber + 1,
            request.CustomerName, request.CustomerPhone,
            serviceId, employeeId, request.EstimatedWait);

        _context.QueueItems.Add(item);
        await _context.SaveChangesAsync(ct);
        return item.Id;
    }
}

public class AddQueueEntryCommandValidator : AbstractValidator<AddQueueEntryCommand>
{
    public AddQueueEntryCommandValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.EstimatedWait).GreaterThanOrEqualTo(0);
    }
}

// ── Status transitions ───────────────────────────────────────────────────────

public record UpdateQueueStatusCommand(Guid Id, string Status) : IRequest;

public sealed class UpdateQueueStatusCommandHandler : IRequestHandler<UpdateQueueStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateQueueStatusCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateQueueStatusCommand request, CancellationToken ct)
    {
        var item = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == request.Id && q.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Queue entry not found.");

        switch (request.Status)
        {
            case "in_service": item.Call(); break;
            case "completed": item.Complete(); break;
            case "cancelled": item.Cancel(); break;
            default: throw new ArgumentException($"Unsupported status '{request.Status}'.");
        }

        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteQueueEntryCommand(Guid Id) : IRequest;

public sealed class DeleteQueueEntryCommandHandler : IRequestHandler<DeleteQueueEntryCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteQueueEntryCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteQueueEntryCommand request, CancellationToken ct)
    {
        var item = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == request.Id && q.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Queue entry not found.");

        _context.QueueItems.Remove(item);
        await _context.SaveChangesAsync(ct);
    }
}
