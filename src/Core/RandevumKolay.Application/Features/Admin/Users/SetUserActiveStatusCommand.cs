using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Users;

/// <summary>Manager-panel action to block/unblock any platform user (business
/// owner, employee, or customer).</summary>
public record SetUserActiveStatusCommand(Guid UserId, bool IsActive) : IRequest;

public sealed class SetUserActiveStatusCommandHandler : IRequestHandler<SetUserActiveStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SetUserActiveStatusCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task Handle(SetUserActiveStatusCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId == _currentUserService.UserId)
            throw new InvalidOperationException("Kendi hesabınızı devre dışı bırakamazsınız.");

        var user = await _context.Users.FindAsync([request.UserId], cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (request.IsActive) user.Activate();
        else user.Deactivate();

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class SetUserActiveStatusCommandValidator : AbstractValidator<SetUserActiveStatusCommand>
{
    public SetUserActiveStatusCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}
