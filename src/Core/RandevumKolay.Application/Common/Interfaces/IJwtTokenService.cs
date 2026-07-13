namespace RandevumKolay.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(TokenClaims claims);
    TokenClaims? ValidateToken(string token);
    string GenerateEmailVerificationToken(Guid userId, string email);
    Guid? ValidateEmailVerificationToken(string token);
    string GeneratePasswordResetToken(Guid userId, string email);
    Guid? ValidatePasswordResetToken(string token);
}

public record TokenClaims(
    Guid UserId,
    string Email,
    string Role,
    Guid? TenantId,
    List<string> Permissions);
