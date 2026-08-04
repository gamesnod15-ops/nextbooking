using FluentValidation;

namespace RandevumKolay.Application.Features.Tenants.Commands.CreateBusinessForCurrentUser;

public class CreateBusinessForCurrentUserCommandValidator : AbstractValidator<CreateBusinessForCurrentUserCommand>
{
    public CreateBusinessForCurrentUserCommandValidator()
    {
        RuleFor(x => x.BusinessName)
            .NotEmpty().MaximumLength(200);

        RuleFor(x => x.Subdomain)
            .NotEmpty()
            .MinimumLength(3).MaximumLength(50)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Subdomain can only contain lowercase letters, numbers, and hyphens.");

        RuleFor(x => x.BusinessCategory).IsInEnum();
    }
}
