using Hangfire;
using RandevumKolay.Application.Common.Interfaces;
using System.Linq.Expressions;

namespace RandevumKolay.Infrastructure.BackgroundJobs;

public class HangfireJobService : IJobService
{
    public string Enqueue<T>(Expression<Func<T, Task>> methodCall)
    {
        return BackgroundJob.Enqueue(methodCall);
    }

    public string Schedule<T>(Expression<Func<T, Task>> methodCall, TimeSpan delay)
    {
        return BackgroundJob.Schedule(methodCall, delay);
    }

    public string Schedule<T>(Expression<Func<T, Task>> methodCall, DateTimeOffset runAt)
    {
        return BackgroundJob.Schedule(methodCall, runAt);
    }

    public void AddOrUpdateRecurring<T>(
        string jobId,
        Expression<Func<T, Task>> methodCall,
        string cronExpression)
    {
        RecurringJob.AddOrUpdate(jobId, methodCall, cronExpression);
    }
}
