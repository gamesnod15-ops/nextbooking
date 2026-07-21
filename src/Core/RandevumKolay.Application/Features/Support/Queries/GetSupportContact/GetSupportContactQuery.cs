using MediatR;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Support.Queries.GetSupportContact;

public record SupportContactDto(string Email, string Phone);

public record GetSupportContactQuery : IRequest<SupportContactDto>;

public sealed class GetSupportContactQueryHandler : IRequestHandler<GetSupportContactQuery, SupportContactDto>
{
    private readonly ISupportSettingsProvider _supportSettings;

    public GetSupportContactQueryHandler(ISupportSettingsProvider supportSettings)
    {
        _supportSettings = supportSettings;
    }

    public Task<SupportContactDto> Handle(GetSupportContactQuery request, CancellationToken cancellationToken)
    {
        return Task.FromResult(new SupportContactDto(_supportSettings.Email, _supportSettings.Phone));
    }
}
