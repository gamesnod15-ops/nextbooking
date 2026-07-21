using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RandevumKolay.Application.Common.Interfaces;
using System.Net;
using System.Net.Mail;

namespace RandevumKolay.Infrastructure.Notifications.Email;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.UserName) || string.IsNullOrWhiteSpace(_settings.Password))
        {
            _logger.LogInformation(
                "[EMAIL LOGGED TO CONSOLE] To: {To} | Subject: {Subject} | Body: {Body}",
                message.To, message.Subject, message.HtmlBody);
            await Task.CompletedTask;
            return;
        }

        try
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
                EnableSsl = _settings.UseSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, message.FromName ?? _settings.FromName),
                Subject = message.Subject,
                Body = message.HtmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(message.To);

            if (message.ReplyTo is not null)
                mailMessage.ReplyToList.Add(new MailAddress(message.ReplyTo));

            await client.SendMailAsync(mailMessage, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", message.To);
            throw;
        }
    }

    public async Task SendTemplateAsync(
        string to,
        string templateName,
        object model,
        CancellationToken cancellationToken = default)
    {
        // For now, serialize model to HTML; swap with Razor/Scriban template engine
        var html = $"<pre>{System.Text.Json.JsonSerializer.Serialize(model)}</pre>";
        await SendAsync(new EmailMessage(to, templateName, html), cancellationToken);
    }
}

public class SmtpSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "BookingAi";
    public bool UseSsl { get; set; } = true;
}
