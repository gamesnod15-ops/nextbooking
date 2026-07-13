using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace RandevumKolay.Application.Common.Behaviours;

public class PerformanceBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<PerformanceBehaviour<TRequest, TResponse>> _logger;
    private readonly Interfaces.ICurrentUserService _currentUserService;

    public PerformanceBehaviour(
        ILogger<PerformanceBehaviour<TRequest, TResponse>> logger,
        Interfaces.ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        var response = await next();
        sw.Stop();

        var elapsed = sw.ElapsedMilliseconds;
        if (elapsed > 500)
        {
            _logger.LogWarning(
                "RandevumKolay Long Running Request: {Name} ({Elapsed} ms) {@UserId} {@Request}",
                typeof(TRequest).Name, elapsed, _currentUserService.UserId, request);
        }

        return response;
    }
}
