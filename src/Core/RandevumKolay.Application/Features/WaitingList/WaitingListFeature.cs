using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.WaitingList;

/// <summary>Waiting list (bekleme listesi) — customers waiting for a free slot.</summary>
public record WaitingListEntryDto(
    Guid Id,
    string CustomerName,
    string? CustomerPhone,
    string? PreferredDate,
    Guid? ServiceId,
    string? ServiceName,
    Guid? EmployeeId,
    string Status,
    string? Notes,
    DateTimeOffset CreatedAt);

internal static class WaitingListMapping
{
    public static string ToApi(this WaitingListStatus s) => s switch
    {
        WaitingListStatus.Waiting => "waiting",
        WaitingListStatus.Notified => "notified",
        WaitingListStatus.Confirmed => "confirmed",
        WaitingListStatus.Booked => "booked",
        _ => "cancelled",
    };
}

// ── Query ────────────────────────────────────────────────────────────────────

public record GetWaitingListQuery : IRequest<List<WaitingListEntryDto>>;

public sealed class GetWaitingListQueryHandler : IRequestHandler<GetWaitingListQuery, List<WaitingListEntryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetWaitingListQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<List<WaitingListEntryDto>> Handle(GetWaitingListQuery request, CancellationToken ct)
    {
        var entries = await _context.WaitingListEntries.AsNoTracking()
            .Where(w => w.TenantId == _tenant.TenantId)
            .OrderBy(w => w.Status == WaitingListStatus.Waiting ? 0 : 1)
            .ThenByDescending(w => w.CreatedAt)
            .ToListAsync(ct);

        var serviceNames = await _context.Services.AsNoTracking()
            .Where(s => s.TenantId == _tenant.TenantId)
            .ToDictionaryAsync(s => s.Id, s => s.Name, ct);

        return entries.Select(w => new WaitingListEntryDto(
            w.Id,
            w.CustomerName,
            w.CustomerPhone,
            w.PreferredDate?.ToString("yyyy-MM-dd"),
            w.ServiceId,
            w.ServiceId.HasValue && serviceNames.TryGetValue(w.ServiceId.Value, out var sn) ? sn : null,
            w.EmployeeId,
            w.Status.ToApi(),
            w.Notes,
            w.CreatedAt)).ToList();
    }
}

// ── Create ───────────────────────────────────────────────────────────────────

/// <param name="ServiceName">
/// Convenience for clients that only collect a free-text service (mobile).
/// Matched against the tenant's services by name; ignored when ServiceId is
/// supplied or no service matches.
/// </param>
public record AddWaitingListEntryCommand(
    string CustomerName,
    string? CustomerPhone,
    Guid? ServiceId,
    Guid? EmployeeId,
    string? PreferredDate,
    string? Notes,
    string? ServiceName = null) : IRequest<Guid>;

public sealed class AddWaitingListEntryCommandHandler : IRequestHandler<AddWaitingListEntryCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public AddWaitingListEntryCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(AddWaitingListEntryCommand request, CancellationToken ct)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenant.TenantId, ct)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        DateOnly? preferred = DateOnly.TryParse(request.PreferredDate, out var d) ? d : null;

        var serviceId = request.ServiceId;
        if (serviceId is null && !string.IsNullOrWhiteSpace(request.ServiceName))
        {
            serviceId = (await _context.Services
                .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId
                                       && s.Name == request.ServiceName, ct))?.Id;
        }

        var entry = WaitingListEntry.Create(
            _tenant.TenantId, business.Id, request.CustomerName, request.CustomerPhone,
            serviceId, request.EmployeeId, preferred, null, request.Notes);

        _context.WaitingListEntries.Add(entry);
        await _context.SaveChangesAsync(ct);
        return entry.Id;
    }
}

public class AddWaitingListEntryCommandValidator : AbstractValidator<AddWaitingListEntryCommand>
{
    public AddWaitingListEntryCommandValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Notes).MaximumLength(1000).When(x => x.Notes is not null);
    }
}

// ── Status transitions ───────────────────────────────────────────────────────

public record UpdateWaitingListStatusCommand(Guid Id, string Status) : IRequest;

public sealed class UpdateWaitingListStatusCommandHandler : IRequestHandler<UpdateWaitingListStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateWaitingListStatusCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateWaitingListStatusCommand request, CancellationToken ct)
    {
        var entry = await _context.WaitingListEntries
            .FirstOrDefaultAsync(w => w.Id == request.Id && w.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Waiting list entry not found.");

        switch (request.Status)
        {
            case "notified": entry.Notify(); break;
            case "confirmed": entry.Confirm(); break;
            case "booked": entry.Book(); break;
            case "cancelled": entry.Cancel(); break;
            default: throw new ArgumentException($"Unsupported status '{request.Status}'.");
        }

        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteWaitingListEntryCommand(Guid Id) : IRequest;

public sealed class DeleteWaitingListEntryCommandHandler : IRequestHandler<DeleteWaitingListEntryCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteWaitingListEntryCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteWaitingListEntryCommand request, CancellationToken ct)
    {
        var entry = await _context.WaitingListEntries
            .FirstOrDefaultAsync(w => w.Id == request.Id && w.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Waiting list entry not found.");

        _context.WaitingListEntries.Remove(entry);
        await _context.SaveChangesAsync(ct);
    }
}
