namespace RandevumKolay.Application.Common.Interfaces;

public interface IWinBackScanJob
{
    Task RunAsync(CancellationToken cancellationToken = default);
}
