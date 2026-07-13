namespace RandevumKolay.Application.Common.Interfaces;

public interface IPaymentService
{
    Task<InitiatePaymentResult> InitiateAsync(InitiatePaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentVerificationResult> VerifyAsync(string providerPaymentId, CancellationToken cancellationToken = default);
    Task<bool> RefundAsync(string providerPaymentId, decimal amount, CancellationToken cancellationToken = default);
}

public record InitiatePaymentRequest(
    string ConversationId,
    decimal Amount,
    string Currency,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string CustomerIp,
    string CallbackUrl,
    string? Description = null);

public record InitiatePaymentResult(
    bool Success,
    string? PaymentPageUrl,
    string? ConversationId,
    string? ErrorMessage = null);

public record PaymentVerificationResult(
    bool Success,
    string? ProviderPaymentId,
    string? ErrorMessage = null);
