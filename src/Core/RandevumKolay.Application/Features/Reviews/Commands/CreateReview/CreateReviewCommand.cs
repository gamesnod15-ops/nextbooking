using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Reviews.Commands.CreateReview;

public record CreateReviewCommand(
    Guid BusinessId,
    string AuthorName,
    int Rating,
    string? Comment) : IRequest<ReviewDto>;

public record ReviewDto(Guid Id, string AuthorName, int Rating, string? Comment, DateTimeOffset CreatedAt);

public sealed class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    private readonly IApplicationDbContext _context;

    public CreateReviewCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<ReviewDto> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        var businessExists = await _context.Businesses
            .AnyAsync(b => b.Id == request.BusinessId && b.IsActive, cancellationToken);

        if (!businessExists)
            throw new KeyNotFoundException("İşletme bulunamadı.");

        var review = Review.Create(request.BusinessId, request.AuthorName, request.Rating, request.Comment);
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);

        return new ReviewDto(review.Id, review.AuthorName, review.Rating, review.Comment, review.CreatedAt);
    }
}

public class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.BusinessId).NotEmpty();
        RuleFor(x => x.AuthorName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).MaximumLength(2000);
    }
}
