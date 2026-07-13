namespace RandevumKolay.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception inner) : base(message, inner) { }
}

public class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message) : base(message) { }
}

public class TenantNotFoundException : DomainException
{
    public TenantNotFoundException(string subdomain)
        : base($"Tenant with subdomain '{subdomain}' was not found.") { }
}

public class ConflictingAppointmentException : DomainException
{
    public ConflictingAppointmentException()
        : base("The selected time slot is not available.") { }
}
