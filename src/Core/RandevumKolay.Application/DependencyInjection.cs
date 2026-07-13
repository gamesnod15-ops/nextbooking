using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using RandevumKolay.Application.Common.Behaviours;
using System.Globalization;
using System.Reflection;

namespace RandevumKolay.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        ValidatorOptions.Global.LanguageManager.Culture = new CultureInfo("tr");

        return services;
    }
}
