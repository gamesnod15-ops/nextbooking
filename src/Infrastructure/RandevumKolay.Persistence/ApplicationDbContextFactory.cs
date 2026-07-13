using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using RandevumKolay.Persistence.Interceptors;

namespace RandevumKolay.Persistence;

/// <summary>
/// EF Core design-time factory — used by `dotnet ef` CLI without a running app.
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "API", "RandevumKolay.API"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=randevumkolay;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder
            .UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
            })
            .UseSnakeCaseNamingConvention();

        // Stub services for design-time — interceptors are no-ops without real services
        var auditInterceptor = new AuditableEntityInterceptor(new DesignTimeCurrentUserService());
        var softDeleteInterceptor = new SoftDeleteInterceptor();

        return new ApplicationDbContext(
            optionsBuilder.Options,
            new DesignTimeTenantService(),
            auditInterceptor,
            softDeleteInterceptor);
    }
}

// Minimal stubs — only used during `dotnet ef` commands, never in production
file sealed class DesignTimeTenantService : RandevumKolay.Application.Common.Interfaces.ICurrentTenantService
{
    public Guid TenantId => Guid.Empty;
    public Guid? TenantIdOrNull => null;
    public string Subdomain => string.Empty;
    public bool IsSet => false;
    public void SetTenant(Guid tenantId, string subdomain) { }
}

file sealed class DesignTimeCurrentUserService : RandevumKolay.Application.Common.Interfaces.ICurrentUserService
{
    public Guid? UserId => null;
    public string? Email => null;
    public string? Role => null;
    public bool IsAuthenticated => false;
    public bool HasPermission(string permission) => false;
}
