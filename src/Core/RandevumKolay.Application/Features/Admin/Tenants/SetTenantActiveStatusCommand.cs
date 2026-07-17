using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Tenants;

/// <summary>Manager-panel action to suspend/restore an entire business
/// (tenant), independent of blocking its individual users.</summary>
public record SetTenantActiveStatusCommand(Guid TenantId, bool IsActive) : IRequest;

public sealed class SetTenantActiveStatusCommandHandler : IRequestHandler<SetTenantActiveStatusCommand>
{
    private readonly IApplicationDbContext _context;

    public SetTenantActiveStatusCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(SetTenantActiveStatusCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants.FindAsync([request.TenantId], cancellationToken)
            ?? throw new KeyNotFoundException("İşletme bulunamadı.");

        if (request.IsActive) tenant.Activate();
        else tenant.Deactivate();

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class SetTenantActiveStatusCommandValidator : AbstractValidator<SetTenantActiveStatusCommand>
{
    public SetTenantActiveStatusCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
