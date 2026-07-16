using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Surveys;

/// <summary>
/// Post-appointment satisfaction feedback (memnuniyet anketi). A Survey row is
/// one customer's response — rating plus optional comment.
/// </summary>
public record SurveyDto(
    Guid Id,
    string? CustomerName,
    int Rating,
    string? Comment,
    bool IsApproved,
    Guid? AppointmentId,
    string? ServiceName,
    DateTimeOffset CreatedAt);

// ── Query ────────────────────────────────────────────────────────────────────

public record GetSurveysQuery(bool? IsApproved = null) : IRequest<List<SurveyDto>>;

public sealed class GetSurveysQueryHandler : IRequestHandler<GetSurveysQuery, List<SurveyDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetSurveysQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<List<SurveyDto>> Handle(GetSurveysQuery request, CancellationToken ct)
    {
        var q = _context.Surveys.AsNoTracking()
            .Where(s => s.TenantId == _tenant.TenantId);

        if (request.IsApproved.HasValue)
            q = q.Where(s => s.IsApproved == request.IsApproved.Value);

        var surveys = await q.OrderByDescending(s => s.CreatedAt).ToListAsync(ct);

        // Resolve the service each piece of feedback relates to, via its appointment.
        var appointmentIds = surveys.Where(s => s.AppointmentId.HasValue)
            .Select(s => s.AppointmentId!.Value).Distinct().ToList();

        var serviceByAppointment = appointmentIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _context.Appointments.AsNoTracking()
                .Where(a => appointmentIds.Contains(a.Id))
                .Join(_context.Services.AsNoTracking(), a => a.ServiceId, s => s.Id,
                    (a, s) => new { a.Id, s.Name })
                .ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        return surveys.Select(s => new SurveyDto(
            s.Id,
            s.CustomerName,
            s.Rating,
            s.Comment,
            s.IsApproved,
            s.AppointmentId,
            s.AppointmentId.HasValue && serviceByAppointment.TryGetValue(s.AppointmentId.Value, out var sn) ? sn : null,
            s.CreatedAt)).ToList();
    }
}

// ── Create ───────────────────────────────────────────────────────────────────

public record CreateSurveyCommand(
    int Rating,
    string? CustomerName,
    string? Comment,
    Guid? AppointmentId) : IRequest<Guid>;

public sealed class CreateSurveyCommandHandler : IRequestHandler<CreateSurveyCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateSurveyCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateSurveyCommand request, CancellationToken ct)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenant.TenantId, ct)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        var survey = Survey.Create(
            _tenant.TenantId, business.Id, request.Rating,
            request.CustomerName, request.AppointmentId, request.Comment);

        _context.Surveys.Add(survey);
        await _context.SaveChangesAsync(ct);
        return survey.Id;
    }
}

public class CreateSurveyCommandValidator : AbstractValidator<CreateSurveyCommand>
{
    public CreateSurveyCommandValidator()
    {
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.CustomerName).MaximumLength(200).When(x => x.CustomerName is not null);
        RuleFor(x => x.Comment).MaximumLength(2000).When(x => x.Comment is not null);
    }
}

// ── Moderation / Delete ──────────────────────────────────────────────────────

public record SetSurveyApprovalCommand(Guid Id, bool IsApproved) : IRequest;

public sealed class SetSurveyApprovalCommandHandler : IRequestHandler<SetSurveyApprovalCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public SetSurveyApprovalCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(SetSurveyApprovalCommand request, CancellationToken ct)
    {
        var survey = await _context.Surveys
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Survey not found.");

        if (request.IsApproved) survey.Approve(); else survey.Reject();
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteSurveyCommand(Guid Id) : IRequest;

public sealed class DeleteSurveyCommandHandler : IRequestHandler<DeleteSurveyCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteSurveyCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteSurveyCommand request, CancellationToken ct)
    {
        var survey = await _context.Surveys
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Survey not found.");

        _context.Surveys.Remove(survey);
        await _context.SaveChangesAsync(ct);
    }
}
