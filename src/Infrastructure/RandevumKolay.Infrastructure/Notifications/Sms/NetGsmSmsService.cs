using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RandevumKolay.Application.Common.Interfaces;
using System.Text;

namespace RandevumKolay.Infrastructure.Notifications.Sms;

public class NetGsmSmsService : ISmsService
{
    private readonly NetGsmSettings _settings;
    private readonly HttpClient _httpClient;
    private readonly ILogger<NetGsmSmsService> _logger;

    public NetGsmSmsService(
        HttpClient httpClient,
        IOptions<NetGsmSettings> settings,
        ILogger<NetGsmSmsService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(
        string to,
        string message,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var phone = FormatPhone(to);
            var xml = $"""
                <?xml version="1.0" encoding="UTF-8" ?>
                <mainbody>
                    <header>
                        <company dil="TR">Netgsm</company>
                        <usercode>{_settings.UserCode}</usercode>
                        <password>{_settings.Password}</password>
                        <type>1:n</type>
                        <msgheader>{_settings.SenderName}</msgheader>
                    </header>
                    <body>
                        <msg><![CDATA[{message}]]></msg>
                        <no>{phone}</no>
                    </body>
                </mainbody>
                """;

            var content = new StringContent(xml, Encoding.UTF8, "text/xml");
            var response = await _httpClient.PostAsync(
                "https://api.netgsm.com.tr/sms/send/xml",
                content, cancellationToken);

            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            var success = response.IsSuccessStatusCode && responseText.StartsWith("00");

            if (!success)
                _logger.LogWarning("NetGSM SMS failed for {Phone}: {Response}", phone, responseText);

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NetGSM SMS send error for {Phone}", to);
            return false;
        }
    }

    public async Task<bool> SendOtpAsync(
        string to,
        string otp,
        CancellationToken cancellationToken = default)
    {
        var message = $"RandevumKolay doğrulama kodunuz: {otp}. Bu kod 5 dakika geçerlidir.";
        return await SendAsync(to, message, cancellationToken);
    }

    private static string FormatPhone(string phone)
    {
        phone = phone.Replace("+", "").Replace(" ", "").Replace("-", "");
        if (phone.StartsWith("0")) phone = "90" + phone[1..];
        if (!phone.StartsWith("90")) phone = "90" + phone;
        return phone;
    }
}

public class NetGsmSettings
{
    public string UserCode { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string SenderName { get; set; } = "RANDEVUM";
}
