using MediatR;

namespace RandevumKolay.Domain.Common;

public interface IDomainEvent : INotification
{
    DateTimeOffset OccurredAt { get; }
}
