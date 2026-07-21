using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// One row per tenant — tracks whether a WhatsApp Business channel has been
/// connected, gating the WhatsApp Bot page. Credentials are stored plaintext
/// for now since no real inbound/outbound WhatsApp sender exists yet to
/// consume them; encrypt once a real Meta/Twilio channel is built.
/// </summary>
public class WhatsAppIntegration : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string? PhoneNumberId { get; private set; }
    public string? AccessToken { get; private set; }
    public bool IsConnected { get; private set; }
    public DateTimeOffset? ConnectedAt { get; private set; }

    private WhatsAppIntegration() { }

    public static WhatsAppIntegration CreateDisconnected(Guid tenantId) => new()
    {
        TenantId = tenantId,
        IsConnected = false,
    };

    public void Connect(string phoneNumberId, string accessToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(phoneNumberId);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

        PhoneNumberId = phoneNumberId;
        AccessToken = accessToken;
        IsConnected = true;
        ConnectedAt = DateTimeOffset.UtcNow;
    }

    public void Disconnect() => IsConnected = false;
}
