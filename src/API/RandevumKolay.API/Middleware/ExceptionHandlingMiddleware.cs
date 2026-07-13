using RandevumKolay.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace RandevumKolay.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "Validation failed.",
                ve.Errors.ToDictionary(k => k.Key, v => v.Value)),

            NotFoundException nfe => (
                HttpStatusCode.NotFound,
                nfe.Message,
                (Dictionary<string, string[]>?)null),

            ForbiddenAccessException fae => (
                HttpStatusCode.Forbidden,
                fae.Message,
                (Dictionary<string, string[]>?)null),

            ConflictException ce => (
                HttpStatusCode.Conflict,
                ce.Message,
                (Dictionary<string, string[]>?)null),

            Domain.Exceptions.BusinessRuleException bre => (
                HttpStatusCode.UnprocessableEntity,
                bre.Message,
                (Dictionary<string, string[]>?)null),

            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred.",
                (Dictionary<string, string[]>?)null)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception");

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse(
            (int)statusCode,
            message,
            errors,
            context.TraceIdentifier);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

public record ErrorResponse(
    int Status,
    string Message,
    Dictionary<string, string[]>? Errors,
    string TraceId);
