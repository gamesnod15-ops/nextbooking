using RandevumKolay.Domain.Common;

namespace RandevumKolay.Domain.Entities;

/// <summary>
/// One of the platform's fixed pricing-page display positions (always
/// exactly 4 — seeded once and never added to or removed from). Each slot
/// optionally points at a <see cref="PricingPlan"/> to show there; an admin
/// can have many candidate plans but only ever 4 shown at a time.
/// </summary>
public class PricingPlanSlot : AuditableEntity
{
    public int SlotNumber { get; private set; }
    public Guid? PricingPlanId { get; private set; }

    private PricingPlanSlot() { }

    public static PricingPlanSlot Create(int slotNumber)
    {
        if (slotNumber < 1) throw new ArgumentOutOfRangeException(nameof(slotNumber));
        return new PricingPlanSlot { SlotNumber = slotNumber };
    }

    public void Assign(Guid? pricingPlanId) => PricingPlanId = pricingPlanId;
}
