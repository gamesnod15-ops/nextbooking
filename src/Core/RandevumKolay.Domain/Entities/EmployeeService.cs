namespace RandevumKolay.Domain.Entities;

public class EmployeeService
{
    public Guid EmployeeId { get; private set; }
    public Guid ServiceId { get; private set; }
    public Employee? Employee { get; private set; }
    public Service? Service { get; private set; }

    private EmployeeService() { }

    public static EmployeeService Create(Guid employeeId, Guid serviceId)
    {
        return new EmployeeService
        {
            EmployeeId = employeeId,
            ServiceId = serviceId
        };
    }
}
