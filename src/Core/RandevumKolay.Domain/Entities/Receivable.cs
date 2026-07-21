using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

public class Receivable : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string? CustomerPhone { get; private set; }
    public string? Description { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal PaidAmount { get; private set; }
    public DateOnly DueDate { get; private set; }
    public ReceivableStatus Status { get; private set; } = ReceivableStatus.Open;
    public int InstallmentCount { get; private set; } = 1;

    private readonly List<Installment> _installments = new();
    public IReadOnlyList<Installment> Installments => _installments.AsReadOnly();

    private Receivable() { }

    public static Receivable Create(
        Guid tenantId,
        string customerName,
        decimal totalAmount,
        DateOnly dueDate,
        int installmentCount = 1,
        string? customerPhone = null,
        string? description = null)
    {
        return new Receivable
        {
            TenantId = tenantId,
            CustomerName = customerName,
            TotalAmount = totalAmount,
            DueDate = dueDate,
            InstallmentCount = installmentCount,
            CustomerPhone = customerPhone,
            Description = description
        };
    }

    public void AddPayment(decimal amount)
    {
        PaidAmount = Math.Min(TotalAmount, PaidAmount + amount);
        Status = PaidAmount >= TotalAmount
            ? ReceivableStatus.Paid
            : PaidAmount > 0
                ? ReceivableStatus.PartiallyPaid
                : ReceivableStatus.Open;
    }

    public void Update(string customerName, decimal totalAmount, DateOnly dueDate,
        int installmentCount, string? customerPhone, string? description)
    {
        CustomerName = customerName;
        TotalAmount = totalAmount;
        DueDate = dueDate;
        InstallmentCount = installmentCount;
        CustomerPhone = customerPhone;
        Description = description;
    }

    public decimal RemainingAmount => TotalAmount - PaidAmount;
}

public class Installment : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ReceivableId { get; private set; }
    public int InstallmentNumber { get; private set; }
    public decimal Amount { get; private set; }
    public DateOnly DueDate { get; private set; }
    public bool IsPaid { get; private set; }
    public DateOnly? PaidAt { get; private set; }

    public Receivable? Receivable { get; private set; }

    private Installment() { }

    public static Installment Create(Guid tenantId, Guid receivableId, int number,
        decimal amount, DateOnly dueDate) => new Installment
    {
        TenantId = tenantId,
        ReceivableId = receivableId,
        InstallmentNumber = number,
        Amount = amount,
        DueDate = dueDate
    };

    public void MarkPaid(DateOnly paidAt) { IsPaid = true; PaidAt = paidAt; }
}

public enum ReceivableStatus { Open, PartiallyPaid, Paid, Overdue }
