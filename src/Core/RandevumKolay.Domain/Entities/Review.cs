using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Review : BaseEntity
{
    public Guid BusinessId { get; private set; }
    public string AuthorName { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public bool IsApproved { get; private set; }

    private Review() { }

    public static Review Create(Guid businessId, string authorName, int rating, string? comment)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5.");
        if (string.IsNullOrWhiteSpace(authorName))
            throw new ArgumentException("Author name is required.");

        return new Review
        {
            BusinessId = businessId,
            AuthorName = authorName.Trim(),
            Rating = rating,
            Comment = comment?.Trim(),
            IsApproved = true,
        };
    }
}
