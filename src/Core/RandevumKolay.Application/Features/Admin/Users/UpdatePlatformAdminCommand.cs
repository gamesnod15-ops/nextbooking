using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Users;

/// <summary>Updates another platform_admin account's basic info. Password
/// reset is intentionally out of scope here — admins reset via the normal
/// forgot-password flow.</summary>
public record UpdatePlatformAdminCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone) : IRequest;

public sealed class UpdatePlatformAdminCommandHandler : IRequestHandler<UpdatePlatformAdminCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdatePlatformAdminCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdatePlatformAdminCommand request, CancellationToken cancellationToken)
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Yönetici bulunamadı.");

        if (admin.Role != "platform_admin")
            throw new InvalidOperationException("Bu kullanıcı bir platform yöneticisi değil.");

        var email = request.Email.ToLowerInvariant();
        if (email != admin.Email && await _context.Users.AnyAsync(u => u.Email == email && u.Id != request.Id, cancellationToken))
            throw new Common.Exceptions.ConflictException("Bu e-posta adresi zaten kayıtlı.");

        admin.UpdateProfile(request.FirstName, request.LastName, request.Phone, null);
        admin.UpdateEmail(email);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdatePlatformAdminCommandValidator : AbstractValidator<UpdatePlatformAdminCommand>
{
    public UpdatePlatformAdminCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Phone).MaximumLength(20);
    }
}
