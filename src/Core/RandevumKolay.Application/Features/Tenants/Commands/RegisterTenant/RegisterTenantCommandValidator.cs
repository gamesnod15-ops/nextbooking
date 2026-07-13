using FluentValidation;

namespace RandevumKolay.Application.Features.Tenants.Commands.RegisterTenant;

public class RegisterTenantCommandValidator : AbstractValidator<RegisterTenantCommand>
{
    public RegisterTenantCommandValidator()
    {
        RuleFor(x => x.BusinessName)
            .NotEmpty().MaximumLength(200);

        RuleFor(x => x.Subdomain)
            .NotEmpty()
            .MinimumLength(3).MaximumLength(50)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Subdomain can only contain lowercase letters, numbers, and hyphens.");

        RuleFor(x => x.OwnerEmail)
            .NotEmpty().EmailAddress();

        RuleFor(x => x.OwnerPassword)
            .NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");

        RuleFor(x => x.OwnerFirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OwnerLastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OwnerPhone).NotEmpty().Matches(@"^\+?[0-9]{10,15}$");
    }
}
