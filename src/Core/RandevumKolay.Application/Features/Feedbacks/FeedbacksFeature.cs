using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Feedbacks;

/// <summary>
/// Product feedback submitted from the business panel's feedback widget.
/// Authenticated — tenant and author are taken from the current request context.
/// </summary>
public record CreateFeedbackCommand(FeedbackCategory Category, string Message, string? ImageUrls = null) : IRequest<Guid>;

public sealed class CreateFeedbackCommandHandler : IRequestHandler<CreateFeedbackCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly ICurrentUserService _userService;

    public CreateFeedbackCommandHandler(
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        ICurrentUserService userService)
    {
        _context = context;
        _tenantService = tenantService;
        _userService = userService;
    }

    public async Task<Guid> Handle(CreateFeedbackCommand request, CancellationToken cancellationToken)
    {
        var feedback = Feedback.Create(_tenantService.TenantId, _userService.UserId, request.Category, request.Message, request.ImageUrls);

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync(cancellationToken);

        return feedback.Id;
    }
}

public class CreateFeedbackCommandValidator : AbstractValidator<CreateFeedbackCommand>
{
    public CreateFeedbackCommandValidator()
    {
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
    }
}
