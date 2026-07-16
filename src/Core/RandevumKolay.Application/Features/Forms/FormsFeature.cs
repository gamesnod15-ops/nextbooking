using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Forms;

/// <summary>Custom forms (özel formlar) and their submissions.</summary>
public record FormDto(
    Guid Id,
    string Title,
    string? Description,
    int Fields,
    List<FormField> FieldDefinitions,
    int Responses,
    bool IsActive,
    DateTimeOffset CreatedAt);

// ── Query ────────────────────────────────────────────────────────────────────

public record GetFormsQuery : IRequest<List<FormDto>>;

public sealed class GetFormsQueryHandler : IRequestHandler<GetFormsQuery, List<FormDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetFormsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<List<FormDto>> Handle(GetFormsQuery request, CancellationToken ct)
    {
        var forms = await _context.CustomForms.AsNoTracking()
            .Where(f => f.TenantId == _tenant.TenantId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        var responseCounts = await _context.FormSubmissions.AsNoTracking()
            .Where(s => s.TenantId == _tenant.TenantId)
            .GroupBy(s => s.FormId)
            .Select(g => new { FormId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.FormId, x => x.Count, ct);

        return forms.Select(f => new FormDto(
            f.Id,
            f.Title,
            f.Description,
            f.Fields.Count,
            f.Fields,
            responseCounts.TryGetValue(f.Id, out var c) ? c : 0,
            f.IsActive,
            f.CreatedAt)).ToList();
    }
}

// ── Create ───────────────────────────────────────────────────────────────────

/// <param name="FieldCount">
/// Lightweight clients (mobile) only ask for a field count; that many
/// placeholder text fields are created and can be renamed later in the panel.
/// Ignored when <paramref name="Fields"/> is supplied.
/// </param>
public record CreateFormCommand(
    string Title,
    string? Description,
    List<FormField>? Fields,
    int FieldCount = 0) : IRequest<Guid>;

public sealed class CreateFormCommandHandler : IRequestHandler<CreateFormCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateFormCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateFormCommand request, CancellationToken ct)
    {
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.TenantId == _tenant.TenantId, ct)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        var fields = request.Fields is { Count: > 0 }
            ? request.Fields
            : Enumerable.Range(1, Math.Clamp(request.FieldCount, 0, 50))
                .Select(i => new FormField
                {
                    Key = $"alan{i}",
                    Label = $"Alan {i}",
                    Type = "text",
                    Required = false,
                    SortOrder = i,
                })
                .ToList();

        var form = CustomForm.Create(_tenant.TenantId, business.Id, request.Title, fields, request.Description);
        _context.CustomForms.Add(form);
        await _context.SaveChangesAsync(ct);
        return form.Id;
    }
}

public class CreateFormCommandValidator : AbstractValidator<CreateFormCommand>
{
    public CreateFormCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(1000).When(x => x.Description is not null);
        RuleFor(x => x.FieldCount).InclusiveBetween(0, 50);
    }
}

// ── Update / Delete ──────────────────────────────────────────────────────────

public record UpdateFormCommand(
    Guid Id,
    string Title,
    string? Description,
    List<FormField>? Fields,
    bool IsActive) : IRequest;

public sealed class UpdateFormCommandHandler : IRequestHandler<UpdateFormCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateFormCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateFormCommand request, CancellationToken ct)
    {
        var form = await _context.CustomForms
            .FirstOrDefaultAsync(f => f.Id == request.Id && f.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Form not found.");

        form.Update(request.Title, request.Description, request.Fields ?? form.Fields);
        form.SetActive(request.IsActive);
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteFormCommand(Guid Id) : IRequest;

public sealed class DeleteFormCommandHandler : IRequestHandler<DeleteFormCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteFormCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteFormCommand request, CancellationToken ct)
    {
        var form = await _context.CustomForms
            .FirstOrDefaultAsync(f => f.Id == request.Id && f.TenantId == _tenant.TenantId, ct)
            ?? throw new KeyNotFoundException("Form not found.");

        _context.CustomForms.Remove(form);
        await _context.SaveChangesAsync(ct);
    }
}
