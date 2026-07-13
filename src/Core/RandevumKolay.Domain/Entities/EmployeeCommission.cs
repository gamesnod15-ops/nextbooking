using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class EmployeeCommission : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public string EmployeeName { get; private set; } = string.Empty;
    public string Period { get; private set; } = string.Empty;   // e.g. "2026-05"
    public CommissionType Type { get; private set; }
    public decimal BaseAmount { get; private set; }
    public decimal CommissionRate { get; private set; }          // percentage 0-100
    public decimal CommissionAmount { get; private set; }
    public decimal BonusAmount { get; private set; }
    public decimal TotalAmount => CommissionAmount + BonusAmount;
    public CommissionStatus Status { get; private set; } = CommissionStatus.Pending;
    public string? Notes { get; private set; }

    private EmployeeCommission() { }

    public static EmployeeCommission Create(
        Guid tenantId,
        Guid employeeId,
        string employeeName,
        string period,
        CommissionType type,
        decimal baseAmount,
        decimal commissionRate,
        decimal bonusAmount = 0,
        string? notes = null)
    {
        var commissionAmount = Math.Round(baseAmount * commissionRate / 100, 2);
        return new EmployeeCommission
        {
            TenantId = tenantId,
            EmployeeId = employeeId,
            EmployeeName = employeeName,
            Period = period,
            Type = type,
            BaseAmount = baseAmount,
            CommissionRate = commissionRate,
            CommissionAmount = commissionAmount,
            BonusAmount = bonusAmount,
            Notes = notes
        };
    }

    public void Approve() => Status = CommissionStatus.Approved;
    public void MarkPaid() => Status = CommissionStatus.Paid;

    public void Update(decimal baseAmount, decimal commissionRate, decimal bonusAmount, string? notes)
    {
        BaseAmount = baseAmount;
        CommissionRate = commissionRate;
        CommissionAmount = Math.Round(baseAmount * commissionRate / 100, 2);
        BonusAmount = bonusAmount;
        Notes = notes;
    }
}

public enum CommissionType { Service, Sales, Mixed }
public enum CommissionStatus { Pending, Approved, Paid }
