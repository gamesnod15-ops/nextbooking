using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Infrastructure.Cache;

namespace RandevumKolay.API.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // Routes that don't require tenant context
    private static readonly string[] TenantFreeRoutes =
    [
        "/api/v1/tenants/register",
        "/api/v1/auth/login",
        "/api/v1/auth/oauth/google/callback",
        "/api/v1/auth/oauth/apple/callback",
        "/api/v1/auth/oauth/complete-registration",
        "/health",
        "/swagger",
        "/hangfire"
    ];

    public async Task InvokeAsync(
        HttpContext context,
        IApplicationDbContext db,
        ICacheService cache,
        ICurrentTenantService tenantService)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Skip tenant resolution for global routes
        if (TenantFreeRoutes.Any(r => path.StartsWith(r, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var host = context.Request.Host.Host;

        // Extract subdomain: firma1.randevumkolay.com → firma1
        // Also supports X-Tenant header for mobile clients
        var subdomain = context.Request.Headers["X-Tenant"].FirstOrDefault()
            ?? ExtractSubdomain(host);

        if (string.IsNullOrWhiteSpace(subdomain))
        {
            // Fallback for local dev (localhost) or mobile clients:
            // resolve tenant from the JWT "tenant_id" claim
            var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var claimTenantId))
            {
                tenantService.SetTenant(claimTenantId, string.Empty);
            }
            await _next(context);
            return;
        }

        var cacheKey = $"tenant:{subdomain}";
        var tenant = await cache.GetOrSetAsync(
            cacheKey,
            async () => await db.Tenants
                .AsNoTracking()
                .Where(t => t.Subdomain == subdomain && t.IsActive)
                .Select(t => new TenantCacheDto(t.Id, t.Subdomain, t.IsActive))
                .FirstOrDefaultAsync(),
            TimeSpan.FromMinutes(5));

        if (tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new { error = "Tenant not found." });
            return;
        }

        tenantService.SetTenant(tenant.TenantId, tenant.Subdomain);
        await _next(context);
    }

    private static string? ExtractSubdomain(string host)
    {
        // Remove port if present
        var hostname = host.Contains(':') ? host.Split(':')[0] : host;
        var parts = hostname.Split('.');

        // If it's an IP address (all parts are numeric), it's not a subdomain
        if (parts.All(p => int.TryParse(p, out _)))
            return null;

        return parts.Length >= 3 ? parts[0] : null;
    }

    private record TenantCacheDto(Guid TenantId, string Subdomain, bool IsActive);
}
