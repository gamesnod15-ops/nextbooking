using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class DebtRecord : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? CreditorName { get; private set; }    // Borç alınan kişi/kurum
    public string? Description { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal PaidAmount { get; private set; }
    public DateOnly DueDate { get; private set; }
    public DebtCategory Category { get; private set; }
    public DebtStatus Status { get; private set; } = DebtStatus.Open;

    private DebtRecord() { }

    public static DebtRecord Create(
        Guid tenantId,
        string title,
        decimal totalAmount,
        DateOnly dueDate,
        DebtCategory category,
        string? creditorName = null,
        string? description = null)
    {
        return new DebtRecord
        {
            TenantId = tenantId,
            Title = title,
            TotalAmount = totalAmount,
            DueDate = dueDate,
            Category = category,
            CreditorName = creditorName,
            Description = description
        };
    }

    public void AddPayment(decimal amount)
    {
        PaidAmount = Math.Min(TotalAmount, PaidAmount + amount);
        Status = PaidAmount >= TotalAmount
            ? DebtStatus.Paid
            : PaidAmount > 0
                ? DebtStatus.PartiallyPaid
                : DebtStatus.Open;
    }

    public void Update(string title, decimal totalAmount, DateOnly dueDate,
        DebtCategory category, string? creditorName, string? description)
    {
        Title = title;
        TotalAmount = totalAmount;
        DueDate = dueDate;
        Category = category;
        CreditorName = creditorName;
        Description = description;
    }

    public decimal RemainingAmount => TotalAmount - PaidAmount;
}

public enum DebtCategory { Supplier, Rent, Equipment, Loan, Tax, Other }
public enum DebtStatus { Open, PartiallyPaid, Paid, Overdue }
