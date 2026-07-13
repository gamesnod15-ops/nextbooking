using FluentValidation;

namespace RandevumKolay.Application.Features.Appointments.Commands.CreateAppointment;

public class CreateAppointmentCommandValidator : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.ServiceId)
            .NotEmpty().WithMessage("Service is required.");


        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required.")
            .Must(d => DateOnly.TryParse(d, out _)).WithMessage("Invalid date format.");

        RuleFor(x => x.Time)
            .NotEmpty().WithMessage("Time is required.")
            .Must(t => TimeOnly.TryParse(t, out _)).WithMessage("Invalid time format.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required.")
            .MaximumLength(20);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).When(x => x.Notes is not null);
    }
}
