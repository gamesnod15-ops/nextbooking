using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.PushTokens;

/// <summary>
/// Registers (or refreshes) the Expo push token for one app install.
/// Anonymous-friendly: a guest customer has a device id but no user id.
/// </summary>
public record RegisterPushTokenCommand(
    string DeviceId,
    string Token,
    string Platform,
    Guid? UserId = null) : IRequest<Guid>;

public sealed class RegisterPushTokenCommandHandler
    : IRequestHandler<RegisterPushTokenCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public RegisterPushTokenCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(RegisterPushTokenCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId) || string.IsNullOrWhiteSpace(request.Token))
            throw new Common.Exceptions.ValidationException("deviceId and token are required.");

        var deviceId = request.DeviceId.Trim();

        var existing = await _context.PushTokens
            .FirstOrDefaultAsync(p => p.DeviceId == deviceId, cancellationToken);

        if (existing is not null)
        {
            existing.Refresh(request.Token, request.Platform, request.UserId);
            await _context.SaveChangesAsync(cancellationToken);
            return existing.Id;
        }

        var token = PushToken.Create(deviceId, request.Token, request.Platform, request.UserId);
        _context.PushTokens.Add(token);
        await _context.SaveChangesAsync(cancellationToken);
        return token.Id;
    }
}
