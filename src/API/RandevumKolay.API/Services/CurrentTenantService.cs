using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.API.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private Guid _tenantId;
    private string _subdomain = string.Empty;

    public Guid TenantId => IsSet
        ? _tenantId
        : throw new InvalidOperationException("Tenant context is not set.");

    public Guid? TenantIdOrNull => IsSet ? _tenantId : null;

    public string Subdomain => _subdomain;
    public bool IsSet { get; private set; }

    public void SetTenant(Guid tenantId, string subdomain)
    {
        _tenantId = tenantId;
        _subdomain = subdomain;
        IsSet = true;
    }
}
