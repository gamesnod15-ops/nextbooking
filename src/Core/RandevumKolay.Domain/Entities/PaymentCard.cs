using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class PaymentCard : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Brand { get; private set; } = string.Empty;
    public string LastFourDigits { get; private set; } = string.Empty;
    public string ExpiryMonth { get; private set; } = string.Empty;
    public string ExpiryYear { get; private set; } = string.Empty;
    public string CardHolderName { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }

    private PaymentCard() { }

    public static PaymentCard Create(
        Guid tenantId,
        string brand,
        string lastFourDigits,
        string expiryMonth,
        string expiryYear,
        string cardHolderName,
        bool isDefault = false)
    {
        return new PaymentCard
        {
            TenantId = tenantId,
            Brand = brand,
            LastFourDigits = lastFourDigits,
            ExpiryMonth = expiryMonth,
            ExpiryYear = expiryYear,
            CardHolderName = cardHolderName,
            IsDefault = isDefault,
        };
    }

    public void Update(string cardHolderName, string expiryMonth, string expiryYear)
    {
        CardHolderName = cardHolderName;
        ExpiryMonth = expiryMonth;
        ExpiryYear = expiryYear;
    }

    public void SetAsDefault() => IsDefault = true;

    public void RemoveDefault() => IsDefault = false;
}
