using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Infrastructure.AI;
using RandevumKolay.Infrastructure.BackgroundJobs;
using RandevumKolay.Infrastructure.Cache;
using RandevumKolay.Infrastructure.Identity;
using RandevumKolay.Infrastructure.Services;
using RandevumKolay.Infrastructure.Notifications;
using RandevumKolay.Infrastructure.Notifications.Email;
using RandevumKolay.Infrastructure.Notifications.Sms;
using StackExchange.Redis;

namespace RandevumKolay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // JWT
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Password hasher
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

        // Redis — lazy connection so startup doesn't block when Redis is unavailable
        var redisConn = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redisConn))
            redisConn = "localhost:6379";

        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var opts = ConfigurationOptions.Parse(redisConn);
            opts.ConnectTimeout = 3000;
            opts.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(opts);
        });
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.AddScoped<ICacheService, RedisCacheService>();

        // Email
        services.Configure<SmtpSettings>(configuration.GetSection("Smtp"));
        services.AddScoped<IEmailService, SmtpEmailService>();

        services.Configure<RandevumKolay.Infrastructure.Support.SupportSettings>(configuration.GetSection("Support"));
        services.AddScoped<ISupportSettingsProvider, RandevumKolay.Infrastructure.Support.SupportSettingsProvider>();

        // Email verification toggle
        services.Configure<EmailVerificationSettings>(configuration.GetSection("EmailVerification"));
        services.AddScoped<IEmailVerificationConfiguration, EmailVerificationConfiguration>();

        // SMS
        services.Configure<NetGsmSettings>(configuration.GetSection("NetGsm"));
        services.AddHttpClient<ISmsService, NetGsmSmsService>();

        // Notifications
        services.AddScoped<INotificationService, NotificationService>();

        // OAuth
        services.AddHttpClient<IOAuthService, OAuthService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        // AI Services
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<INoShowPredictionService, NoShowPredictionService>();
        services.AddScoped<ISmartNotificationService, SmartNotificationService>();
        services.AddScoped<IScheduleOptimizationService, ScheduleOptimizationService>();

        services.Configure<AnthropicSettings>(configuration.GetSection("Anthropic"));
        services.AddHttpClient<IClaudeService, ClaudeService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddScoped<IAiUsageService, AiUsageService>();
        services.AddScoped<IFallbackBookingService, FallbackBookingService>();

        // Hangfire
        services.AddHangfire(config =>
        {
            config.UsePostgreSqlStorage(c =>
                c.UseNpgsqlConnection(configuration.GetConnectionString("DefaultConnection")));
        });
        services.AddHangfireServer();
        services.AddScoped<IJobService, HangfireJobService>();
        services.AddScoped<IWinBackScanJob, WinBackScanJob>();

        return services;
    }
}
