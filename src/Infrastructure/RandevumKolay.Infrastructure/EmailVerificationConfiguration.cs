using Microsoft.Extensions.Options;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure;

public class EmailVerificationSettings
{
    public bool Required { get; set; }
}

public sealed class EmailVerificationConfiguration
    : IEmailVerificationConfiguration
{
    private readonly EmailVerificationSettings _settings;

    public EmailVerificationConfiguration(IOptions<EmailVerificationSettings> settings)
    {
        _settings = settings.Value;
    }

    public bool Required => _settings.Required;
}
