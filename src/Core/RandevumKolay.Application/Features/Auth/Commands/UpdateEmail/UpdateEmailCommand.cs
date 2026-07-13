using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Exceptions;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Auth.Commands.UpdateEmail;

public record UpdateEmailCommand(string NewEmail) : IRequest;

public sealed class UpdateEmailCommandHandler : IRequestHandler<UpdateEmailCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateEmailCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateEmailCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");

        var email = request.NewEmail?.Trim().ToLowerInvariant()
            ?? throw new ValidationException("E-posta adresi boş olamaz.");

        if (!email.Contains('@') || !email.Contains('.'))
            throw new ValidationException("Geçerli bir e-posta adresi girin.");

        var emailTaken = await _context.Users
            .AnyAsync(u => u.Email == email && u.Id != userId && !u.IsDeleted, cancellationToken);

        if (emailTaken)
            throw new ValidationException("Bu e-posta adresi başka bir hesapta kullanılıyor.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive && !u.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Kullanıcı bulunamadı.");

        user.UpdateEmail(email);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
