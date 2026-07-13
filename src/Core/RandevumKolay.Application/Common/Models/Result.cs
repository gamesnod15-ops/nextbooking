namespace RandevumKolay.Application.Common.Models;

public class Result
{
    public bool Succeeded { get; }
    public string[] Errors { get; }

    private Result(bool succeeded, IEnumerable<string> errors)
    {
        Succeeded = succeeded;
        Errors = errors.ToArray();
    }

    public static Result Success() => new(true, []);
    public static Result Failure(params string[] errors) => new(false, errors);
    public static Result Failure(IEnumerable<string> errors) => new(false, errors);
}

public class Result<T>
{
    public bool Succeeded { get; }
    public T? Data { get; }
    public string[] Errors { get; }

    private Result(bool succeeded, T? data, IEnumerable<string> errors)
    {
        Succeeded = succeeded;
        Data = data;
        Errors = errors.ToArray();
    }

    public static Result<T> Success(T data) => new(true, data, []);
    public static Result<T> Failure(params string[] errors) => new(false, default, errors);
}
