using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Admin.Users;

/// <summary>Creates a new platform_admin account — replaces the manual SQL
/// insert previously needed to onboard a manager-panel operator.</summary>
public record CreatePlatformAdminCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone) : IRequest<Guid>;

public sealed class CreatePlatformAdminCommandHandler : IRequestHandler<CreatePlatformAdminCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public CreatePlatformAdminCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> Handle(CreatePlatformAdminCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new Common.Exceptions.ConflictException("Bu e-posta adresi zaten kayıtlı.");

        var passwordHash = _passwordHasher.Hash(request.Password);
        var admin = User.Create(email, passwordHash, request.FirstName, request.LastName, "platform_admin");

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            admin.UpdateProfile(request.FirstName, request.LastName, request.Phone, null);
        }

        admin.VerifyEmail();

        _context.Users.Add(admin);
        await _context.SaveChangesAsync(cancellationToken);

        return admin.Id;
    }
}

public class CreatePlatformAdminCommandValidator : AbstractValidator<CreatePlatformAdminCommand>
{
    public CreatePlatformAdminCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).MaximumLength(20);
    }
}
