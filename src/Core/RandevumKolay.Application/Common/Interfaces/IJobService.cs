namespace RandevumKolay.Application.Common.Interfaces;

public interface IJobService
{
    string Enqueue<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall);
    string Schedule<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall, TimeSpan delay);
    string Schedule<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall, DateTimeOffset runAt);
    void AddOrUpdateRecurring<T>(string jobId, System.Linq.Expressions.Expression<Func<T, Task>> methodCall, string cronExpression);
}
