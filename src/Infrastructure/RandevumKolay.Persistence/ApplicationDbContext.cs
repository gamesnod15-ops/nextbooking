using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Persistence.Interceptors;
using System.Linq.Expressions;
using System.Reflection;

namespace RandevumKolay.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentTenantService _tenantService;
    private readonly AuditableEntityInterceptor _auditInterceptor;
    private readonly SoftDeleteInterceptor _softDeleteInterceptor;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentTenantService tenantService,
        AuditableEntityInterceptor auditInterceptor,
        SoftDeleteInterceptor softDeleteInterceptor)
        : base(options)
    {
        _tenantService = tenantService;
        _auditInterceptor = auditInterceptor;
        _softDeleteInterceptor = softDeleteInterceptor;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeService> EmployeeServices => Set<EmployeeService>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ScheduleException> ScheduleExceptions => Set<ScheduleException>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<GiftCoupon> GiftCoupons => Set<GiftCoupon>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Receivable> Receivables => Set<Receivable>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<EmployeeCommission> EmployeeCommissions => Set<EmployeeCommission>();
    public DbSet<DebtRecord> DebtRecords => Set<DebtRecord>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Advertisement> Advertisements => Set<Advertisement>();
    public DbSet<UserAuthProvider> UserAuthProviders => Set<UserAuthProvider>();
    public DbSet<PaymentCard> PaymentCards => Set<PaymentCard>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ProductPurchase> ProductPurchases => Set<ProductPurchase>();
    public DbSet<QueueItem> QueueItems => Set<QueueItem>();
    public DbSet<WaitingListEntry> WaitingListEntries => Set<WaitingListEntry>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<CustomForm> CustomForms => Set<CustomForm>();
    public DbSet<FormSubmission> FormSubmissions => Set<FormSubmission>();
    public DbSet<NoShowPrediction> NoShowPredictions => Set<NoShowPrediction>();
    public DbSet<Deposit> Deposits => Set<Deposit>();
    public DbSet<CustomerRecommendation> CustomerRecommendations => Set<CustomerRecommendation>();
    public DbSet<SalesLead> SalesLeads => Set<SalesLead>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder
            .AddInterceptors(_auditInterceptor, _softDeleteInterceptor);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Apply global query filters for soft delete and tenant isolation
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            // Soft delete filter
            if (typeof(Domain.Common.AuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                var param = Expression.Parameter(entityType.ClrType, "e");
                var isDeleted = Expression.Property(param, nameof(Domain.Common.AuditableEntity.IsDeleted));
                var notDeleted = Expression.Not(isDeleted);
                var filter = Expression.Lambda(notDeleted, param);
                builder.Entity(entityType.ClrType).HasQueryFilter(filter);
            }
        }

        base.OnModelCreating(builder);
    }
}
