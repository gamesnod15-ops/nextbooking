using Microsoft.Extensions.Options;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Infrastructure.Support;

public class SupportSettings
{
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class SupportSettingsProvider : ISupportSettingsProvider
{
    private readonly SupportSettings _settings;

    public SupportSettingsProvider(IOptions<SupportSettings> settings)
    {
        _settings = settings.Value;
    }

    public string Email => _settings.Email;
    public string Phone => _settings.Phone;
}
