using Hangfire.Dashboard;
using Microsoft.AspNetCore.Http;

namespace RandevumKolay.Infrastructure.BackgroundJobs;

public class HangfireDashboardAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        return httpContext.User.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("super_admin");
    }
}
