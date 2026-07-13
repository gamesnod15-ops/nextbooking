namespace RandevumKolay.Application.Common.Interfaces;

public interface ISmsService
{
    Task<bool> SendAsync(string to, string message, CancellationToken cancellationToken = default);
    Task<bool> SendOtpAsync(string to, string otp, CancellationToken cancellationToken = default);
}
