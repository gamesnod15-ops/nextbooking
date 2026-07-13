using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Auth.Commands.VerifyPhoneOtp;

public record VerifyPhoneOtpCommand(string Phone, string Otp) : IRequest;

public sealed class VerifyPhoneOtpCommandHandler : IRequestHandler<VerifyPhoneOtpCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cache;

    public VerifyPhoneOtpCommandHandler(IApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task Handle(VerifyPhoneOtpCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Otp))
            throw new ArgumentException("Telefon numarası ve OTP kodu gereklidir.");

        var cacheKey = $"phone_otp:{request.Phone}";
        var storedOtp = await _cache.GetAsync<string>(cacheKey, cancellationToken);

        if (storedOtp is null)
            throw new UnauthorizedAccessException("OTP kodu süresi dolmuş veya geçersiz. Lütfen yeni bir kod isteyin.");

        if (!storedOtp.Equals(request.Otp, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("Hatalı OTP kodu.");

        await _cache.RemoveAsync(cacheKey, cancellationToken);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Phone == request.Phone && !u.IsDeleted, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        user.VerifyPhone();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
