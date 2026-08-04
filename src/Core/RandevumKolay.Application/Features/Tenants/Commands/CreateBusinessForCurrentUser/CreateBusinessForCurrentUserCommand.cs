using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.Tenants.Commands.CreateBusinessForCurrentUser;

/// <summary>
/// Attaches a business to the currently authenticated user's account, instead
/// of RegisterTenantCommand's flow which always creates a brand-new user —
/// that path rejects any email that's already registered, which is exactly
/// the case for an account that signed up via email/password or OAuth first
/// and only decides to become a business owner afterward.
/// </summary>
public record CreateBusinessForCurrentUserCommand(
    string BusinessName,
    string Subdomain,
    BusinessCategory BusinessCategory,
    string Plan = "starter") : IRequest<CreateBusinessForCurrentUserResult>;

public record CreateBusinessForCurrentUserResult(
    string AccessToken,
    Guid TenantId,
    Guid UserId,
    string Role,
    string Subdomain);

public sealed class CreateBusinessForCurrentUserCommandHandler
    : IRequestHandler<CreateBusinessForCurrentUserCommand, CreateBusinessForCurrentUserResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IJwtTokenService _jwtTokenService;

    public CreateBusinessForCurrentUserCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IJwtTokenService jwtTokenService)
    {
        _context = context;
        _currentUser = currentUser;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<CreateBusinessForCurrentUserResult> Handle(
        CreateBusinessForCurrentUserCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new Common.Exceptions.NotFoundException("User not found.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException("User not found.");

        if (user.TenantId.HasValue)
            throw new Common.Exceptions.ConflictException("This account already has a business attached.");

        var subdomainTaken = await _context.Tenants
            .AnyAsync(t => t.Subdomain == request.Subdomain.ToLowerInvariant(), cancellationToken);
        if (subdomainTaken)
            throw new Common.Exceptions.ConflictException($"Subdomain '{request.Subdomain}' is already taken.");

        var tenant = Tenant.Create(request.BusinessName, request.Subdomain, user.Email, request.Plan);
        _context.Tenants.Add(tenant);

        var business = RandevumKolay.Domain.Entities.Business.Create(tenant.Id, request.BusinessName, request.BusinessCategory);
        _context.Businesses.Add(business);

        user.AssignToTenant(tenant.Id, "tenant_admin");

        await _context.SaveChangesAsync(cancellationToken);

        var claims = new TokenClaims(user.Id, user.Email, user.Role, user.TenantId, user.Permissions);
        var accessToken = _jwtTokenService.GenerateAccessToken(claims);

        return new CreateBusinessForCurrentUserResult(accessToken, tenant.Id, user.Id, user.Role, tenant.Subdomain);
    }
}
