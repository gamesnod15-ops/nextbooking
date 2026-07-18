using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using RandevumKolay.Application.Common.Interfaces;

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
        "/api/v1/admin",
        "/api/v1/pricing-plans",
        "/api/v1/tenants/register",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/oauth/google/callback",
        "/api/v1/auth/oauth/apple/callback",
        "/api/v1/auth/oauth/complete-registration",
        "/api/v1/businesses",
        "/api/v1/users",
        "/api/v1/reviews",
        "/api/v1/geocoding",
        "/health",
        "/swagger",
        "/hangfire"
    ];

    public async Task InvokeAsync(
        HttpContext context,
        IApplicationDbContext db,
        IMemoryCache memoryCache,
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
        var tenant = await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await db.Tenants
                .AsNoTracking()
                .Where(t => t.Subdomain == subdomain && t.IsActive)
                .Select(t => new TenantCacheDto(t.Id, t.Subdomain, t.IsActive))
                .FirstOrDefaultAsync();
        });

        if (tenant is null)
        {
            // Subdomain from Host header didn't match any tenant.
            // This happens when requests are proxied (e.g. Vercel rewrite) and the
            // Host header reflects the proxy domain rather than the tenant domain.
            // Fall back to JWT-based tenant resolution before giving up.
            var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var claimTenantId))
            {
                tenantService.SetTenant(claimTenantId, string.Empty);
                await _next(context);
                return;
            }

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
