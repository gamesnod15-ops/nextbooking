using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.ClientErrors;

public record LogClientErrorCommand(
    string Message,
    string? Stack,
    string? ComponentStack,
    string? Scope,
    string Platform,
    string? OsVersion,
    string? AppVersion,
    string? AppEnv,
    string? DeviceId) : IRequest<Unit>;

public sealed class LogClientErrorCommandHandler : IRequestHandler<LogClientErrorCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public LogClientErrorCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(LogClientErrorCommand request, CancellationToken cancellationToken)
    {
        var log = ClientErrorLog.Create(
            request.Message,
            request.Stack,
            request.ComponentStack,
            request.Scope,
            request.Platform,
            request.OsVersion,
            request.AppVersion,
            request.AppEnv,
            request.DeviceId);

        _context.ClientErrorLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
