using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public enum FeedbackCategory { EasyToUse, Confusing, Suggestion, BugReport }

/// <summary>
/// Free-form product feedback submitted by a tenant user from the business
/// panel — what worked well, what was confusing, or what they'd like to see.
/// Purely for internal review; no automated routing yet.
/// </summary>
public class Feedback : AuditableEntity
{
    public Guid TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public FeedbackCategory Category { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public string? ImageUrls { get; private set; }

    private Feedback() { }

    public static Feedback Create(Guid tenantId, Guid? userId, FeedbackCategory category, string message, string? imageUrls = null)
    {
        return new Feedback
        {
            TenantId = tenantId,
            UserId = userId,
            Category = category,
            Message = message,
            ImageUrls = imageUrls,
        };
    }
}
