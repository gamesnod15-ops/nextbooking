using Microsoft.EntityFrameworkCore;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Business> Businesses { get; }
    DbSet<Appointment> Appointments { get; }
    DbSet<Service> Services { get; }
    DbSet<Employee> Employees { get; }
    DbSet<EmployeeService> EmployeeServices { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Schedule> Schedules { get; }
    DbSet<ScheduleException> ScheduleExceptions { get; }
    DbSet<Payment> Payments { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Campaign> Campaigns { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Package> Packages { get; }
    DbSet<GiftCoupon> GiftCoupons { get; }
    DbSet<Product> Products { get; }
    DbSet<Receivable> Receivables { get; }
    DbSet<Installment> Installments { get; }
    DbSet<EmployeeCommission> EmployeeCommissions { get; }
    DbSet<DebtRecord> DebtRecords { get; }
    DbSet<Branch> Branches { get; }
    DbSet<Advertisement> Advertisements { get; }
    DbSet<UserAuthProvider> UserAuthProviders { get; }
    DbSet<PaymentCard> PaymentCards { get; }
    DbSet<Review> Reviews { get; }
    DbSet<ProductPurchase> ProductPurchases { get; }
    DbSet<QueueItem> QueueItems { get; }
    DbSet<WaitingListEntry> WaitingListEntries { get; }
    DbSet<Survey> Surveys { get; }
    DbSet<CustomForm> CustomForms { get; }
    DbSet<FormSubmission> FormSubmissions { get; }
    DbSet<NoShowPrediction> NoShowPredictions { get; }
    DbSet<Deposit> Deposits { get; }
    DbSet<CustomerRecommendation> CustomerRecommendations { get; }
    DbSet<SalesLead> SalesLeads { get; }
    DbSet<Feedback> Feedbacks { get; }
    DbSet<PlatformPayment> PlatformPayments { get; }
    DbSet<PricingPlan> PricingPlans { get; }
    DbSet<PricingPlanSlot> PricingPlanSlots { get; }
    DbSet<WhatsAppConversation> WhatsAppConversations { get; }
    DbSet<WhatsAppMessage> WhatsAppMessages { get; }
    DbSet<WhatsAppBookingDraft> WhatsAppBookingDrafts { get; }
    DbSet<WinBackRule> WinBackRules { get; }
    DbSet<WinBackSendLog> WinBackSendLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
