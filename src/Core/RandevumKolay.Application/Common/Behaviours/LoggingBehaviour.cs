using MediatR;
using Microsoft.Extensions.Logging;

namespace RandevumKolay.Application.Common.Behaviours;

public class LoggingBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;
    private readonly Interfaces.ICurrentUserService _currentUserService;
    private readonly Interfaces.ICurrentTenantService _currentTenantService;

    public LoggingBehaviour(
        ILogger<LoggingBehaviour<TRequest, TResponse>> logger,
        Interfaces.ICurrentUserService currentUserService,
        Interfaces.ICurrentTenantService currentTenantService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
        _currentTenantService = currentTenantService;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId;
        var tenantId = _currentTenantService.IsSet ? _currentTenantService.TenantId : (Guid?)null;

        _logger.LogInformation(
            "RandevumKolay Request: {Name} {@UserId} {@TenantId} {@Request}",
            requestName, userId, tenantId, request);

        return await next();
    }
}
