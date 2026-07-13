namespace RandevumKolay.Application.Common.Interfaces;

public interface ICurrentTenantService
{
    Guid TenantId { get; }
    Guid? TenantIdOrNull { get; }
    string Subdomain { get; }
    bool IsSet { get; }
    void SetTenant(Guid tenantId, string subdomain);
}
