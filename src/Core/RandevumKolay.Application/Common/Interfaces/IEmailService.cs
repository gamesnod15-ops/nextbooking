namespace RandevumKolay.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
    Task SendTemplateAsync(string to, string templateName, object model, CancellationToken cancellationToken = default);
}

public record EmailMessage(
    string To,
    string Subject,
    string HtmlBody,
    string? PlainBody = null,
    string? FromName = null,
    string? ReplyTo = null);
