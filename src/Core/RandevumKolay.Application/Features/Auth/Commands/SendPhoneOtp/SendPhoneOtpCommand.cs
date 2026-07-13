using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Auth.Commands.SendPhoneOtp;

public record SendPhoneOtpCommand(string Phone) : IRequest;

public sealed class SendPhoneOtpCommandHandler : IRequestHandler<SendPhoneOtpCommand>
{
    private readonly ISmsService _smsService;
    private readonly ICacheService _cache;

    public SendPhoneOtpCommandHandler(ISmsService smsService, ICacheService cache)
    {
        _smsService = smsService;
        _cache = cache;
    }

    public async Task Handle(SendPhoneOtpCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
            throw new ArgumentException("Telefon numarası gereklidir.");

        var otp = Random.Shared.Next(100000, 999999).ToString();

        var cacheKey = $"phone_otp:{request.Phone}";
        await _cache.SetAsync(cacheKey, otp, TimeSpan.FromMinutes(5), cancellationToken);

        await _smsService.SendOtpAsync(request.Phone, otp, cancellationToken);
    }
}
