using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Auth.Commands.ResetPassword;

public record ResetPasswordCommand(string Token, string NewPassword) : IRequest;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = _jwtTokenService.ValidatePasswordResetToken(request.Token)
            ?? throw new UnauthorizedAccessException("Gecersiz veya suresi dolmus sifre sifirlama baglantisi.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanici bulunamadi.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Hesabiniz devre disi birakilmis.");

        user.UpdatePassword(_passwordHasher.Hash(request.NewPassword));
        await _context.SaveChangesAsync(cancellationToken);
    }
}
