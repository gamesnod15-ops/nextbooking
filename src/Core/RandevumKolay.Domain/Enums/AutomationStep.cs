namespace RandevumKolay.Domain.Enums;

public enum AutomationStep
{
    None = 0,
    AwaitingService = 1,
    AwaitingDate = 2,
    AwaitingTime = 3,
    AwaitingName = 4,
    AwaitingPhone = 5,
    Confirming = 6
}
