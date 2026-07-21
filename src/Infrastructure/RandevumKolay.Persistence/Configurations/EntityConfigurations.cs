using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Subdomain)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(t => t.Subdomain)
            .IsUnique();

        builder.Property(t => t.Email)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Plan)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.LogoUrl)
            .HasColumnType("text");

        builder.Property(t => t.CustomDomain)
            .HasMaxLength(200);

        builder.Property(t => t.Settings)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());
    }
}

public class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name).HasMaxLength(200).IsRequired();
        builder.Property(b => b.Timezone).HasMaxLength(50).IsRequired();
        builder.Property(b => b.Phone).HasMaxLength(20);
        builder.Property(b => b.Email).HasMaxLength(200);
        builder.Property(b => b.City).HasMaxLength(100);
        builder.Property(b => b.PostalCode).HasMaxLength(20);
        builder.Property(b => b.Country).HasMaxLength(100);
        builder.Property(b => b.TaxNumber).HasMaxLength(50);
        builder.Property(b => b.TaxOffice).HasMaxLength(200);
        builder.Property(b => b.LogoUrl).HasColumnType("text");
        builder.Property(b => b.Latitude);
        builder.Property(b => b.Longitude);

        builder.Property(b => b.GalleryImages)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => SafeDeserializeStringList(v))
            .HasDefaultValueSql("'[]'::jsonb");

        builder.Property(b => b.Settings)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => v == null ? new Dictionary<string, string>() : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());

        builder.HasIndex(b => b.TenantId);

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static List<string> SafeDeserializeStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<string>();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(json, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Price).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(a => a.Notes).HasMaxLength(1000);
        builder.Property(a => a.Source).HasMaxLength(50);
        builder.Property(a => a.CancellationReason).HasMaxLength(500);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(a => new { a.TenantId, a.StartTime });
        builder.HasIndex(a => new { a.EmployeeId, a.StartTime });
        builder.HasIndex(a => a.CustomerId);

        builder.HasOne(a => a.Service)
            .WithMany()
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Employee)
            .WithMany()
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Customer)
            .WithMany()
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(a => a.DomainEvents);
    }
}

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Description).HasMaxLength(2000);
        builder.Property(s => s.Price).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(s => s.ImageUrl).HasMaxLength(500);
        builder.Property(s => s.Color).HasMaxLength(20);
        builder.HasIndex(s => s.TenantId);
    }
}

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Title).HasMaxLength(100);
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.Email).HasMaxLength(200);
        builder.Property(e => e.AvatarUrl).HasMaxLength(500);
        builder.HasIndex(e => e.TenantId);
    }
}

public class EmployeeServiceConfiguration : IEntityTypeConfiguration<EmployeeService>
{
    public void Configure(EntityTypeBuilder<EmployeeService> builder)
    {
        builder.HasKey(es => new { es.EmployeeId, es.ServiceId });

        builder.HasOne(es => es.Employee)
            .WithMany(e => (ICollection<EmployeeService>)e.EmployeeServices)
            .HasForeignKey(es => es.EmployeeId);

        builder.HasOne(es => es.Service)
            .WithMany(s => (ICollection<EmployeeService>)s.EmployeeServices)
            .HasForeignKey(es => es.ServiceId);
    }
}

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(20).IsRequired();
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Notes).HasMaxLength(2000);

        builder.Property(c => c.Tags)
            .HasColumnType("text[]");

        builder.Property(c => c.TotalSpent).HasColumnType("decimal(10,2)");

        builder.HasIndex(c => new { c.TenantId, c.Phone });
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).HasMaxLength(200).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.JobTitle).HasMaxLength(100);
        builder.Property(u => u.Role).HasMaxLength(50).IsRequired();
        builder.Property(u => u.AvatarUrl).HasColumnType("text");

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.TenantId);

        builder.Property(u => u.Permissions)
            .HasColumnType("text[]");

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.TokenHash).HasMaxLength(200).IsRequired();
        builder.Property(r => r.DeviceInfo).HasMaxLength(500);
        builder.Property(r => r.IpAddress).HasMaxLength(50);
        builder.HasIndex(r => r.TokenHash);
        builder.HasIndex(r => r.UserId);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Provider).HasMaxLength(50).IsRequired();
        builder.Property(p => p.ProviderPaymentId).HasMaxLength(200);
        builder.Property(p => p.ProviderConversationId).HasMaxLength(200);
        builder.Property(p => p.Amount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(p => p.Currency).HasMaxLength(3).IsRequired();
        builder.Property(p => p.FailureReason).HasMaxLength(500);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.Metadata)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());

        builder.HasIndex(p => p.AppointmentId);
        builder.HasIndex(p => p.TenantId);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.UserAgent).HasMaxLength(500);

        builder.HasIndex(a => new { a.TenantId, a.CreatedAt });
    }
}

public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(2000);
        builder.Property(c => c.DiscountValue).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(c => c.DiscountType).HasConversion<string>().HasMaxLength(50);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(50);
        builder.Property(c => c.ApplicableServiceIds).HasColumnType("uuid[]");
        builder.HasIndex(c => c.TenantId);
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(2000);
        builder.Property(c => c.DiscountValue).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(c => c.MinimumOrderAmount).HasColumnType("decimal(10,2)");
        builder.Property(c => c.DiscountType).HasConversion<string>().HasMaxLength(50);
        builder.Property(c => c.ApplicableServiceIds).HasColumnType("uuid[]");
        builder.HasIndex(c => new { c.TenantId, c.Code }).IsUnique();
    }
}

public class PackageConfiguration : IEntityTypeConfiguration<Package>
{
    public void Configure(EntityTypeBuilder<Package> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.Price).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(p => p.OriginalPrice).HasColumnType("decimal(10,2)");
        builder.Property(p => p.ImageUrl).HasMaxLength(500);

        builder.Property(p => p.Items)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<Domain.Entities.PackageItem>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new());

        builder.HasIndex(p => p.TenantId);
    }
}

public class GiftCouponConfiguration : IEntityTypeConfiguration<GiftCoupon>
{
    public void Configure(EntityTypeBuilder<GiftCoupon> builder)
    {
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Code).HasMaxLength(50).IsRequired();
        builder.Property(g => g.Amount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(g => g.UsedAmount).HasColumnType("decimal(10,2)");
        builder.Property(g => g.RecipientName).HasMaxLength(200).IsRequired();
        builder.Property(g => g.RecipientEmail).HasMaxLength(200);
        builder.Property(g => g.PurchasedBy).HasMaxLength(200).IsRequired();
        builder.Property(g => g.Message).HasMaxLength(500);
        builder.Property(g => g.Status).HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(g => new { g.TenantId, g.Code }).IsUnique();
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Category).HasMaxLength(100);
        builder.Property(p => p.Barcode).HasMaxLength(100);
        builder.Property(p => p.Unit).HasMaxLength(50);
        builder.Property(p => p.SalePrice).HasColumnType("decimal(12,2)").IsRequired();
        builder.Property(p => p.CostPrice).HasColumnType("decimal(12,2)");
        builder.HasIndex(p => p.TenantId);
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}

public class ReceivableConfiguration : IEntityTypeConfiguration<Receivable>
{
    public void Configure(EntityTypeBuilder<Receivable> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(r => r.CustomerPhone).HasMaxLength(20);
        builder.Property(r => r.TotalAmount).HasColumnType("decimal(12,2)").IsRequired();
        builder.Property(r => r.PaidAmount).HasColumnType("decimal(12,2)");
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(30);
        builder.HasMany(r => r.Installments).WithOne(i => i.Receivable).HasForeignKey(i => i.ReceivableId);
        builder.HasIndex(r => r.TenantId);
    }
}

public class InstallmentConfiguration : IEntityTypeConfiguration<Installment>
{
    public void Configure(EntityTypeBuilder<Installment> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Amount).HasColumnType("decimal(12,2)").IsRequired();
        builder.HasIndex(i => new { i.TenantId, i.ReceivableId });
    }
}

public class EmployeeCommissionConfiguration : IEntityTypeConfiguration<EmployeeCommission>
{
    public void Configure(EntityTypeBuilder<EmployeeCommission> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.EmployeeName).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Period).HasMaxLength(10).IsRequired();
        builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.BaseAmount).HasColumnType("decimal(12,2)");
        builder.Property(c => c.CommissionRate).HasColumnType("decimal(5,2)");
        builder.Property(c => c.CommissionAmount).HasColumnType("decimal(12,2)");
        builder.Property(c => c.BonusAmount).HasColumnType("decimal(12,2)");
        builder.Ignore(c => c.TotalAmount);
        builder.HasIndex(c => new { c.TenantId, c.EmployeeId, c.Period });
    }
}

public class DebtRecordConfiguration : IEntityTypeConfiguration<DebtRecord>
{
    public void Configure(EntityTypeBuilder<DebtRecord> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.CreditorName).HasMaxLength(200);
        builder.Property(d => d.TotalAmount).HasColumnType("decimal(12,2)").IsRequired();
        builder.Property(d => d.PaidAmount).HasColumnType("decimal(12,2)");
        builder.Property(d => d.Category).HasConversion<string>().HasMaxLength(30);
        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(30);
        builder.Ignore(d => d.RemainingAmount);
        builder.HasIndex(d => d.TenantId);
        builder.HasQueryFilter(d => !d.IsDeleted);
    }
}

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).HasMaxLength(200).IsRequired();
        builder.Property(b => b.Address).HasMaxLength(500);
        builder.Property(b => b.City).HasMaxLength(100);
        builder.Property(b => b.Phone).HasMaxLength(20);
        builder.Property(b => b.Email).HasMaxLength(200);
        builder.Property(b => b.ManagerName).HasMaxLength(200);
        builder.HasIndex(b => b.TenantId);
        builder.HasQueryFilter(b => !b.IsDeleted);
    }
}

public class AdvertisementConfiguration : IEntityTypeConfiguration<Advertisement>
{
    public void Configure(EntityTypeBuilder<Advertisement> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Title).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Description).HasMaxLength(1000);
        builder.Property(a => a.TargetLocation).HasMaxLength(200);
        builder.Property(a => a.Budget).HasColumnType("decimal(10,2)").IsRequired();

        builder.Property(a => a.PackageType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.TargetCategory)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => new { a.TenantId, a.Status });
    }
}

public class PaymentCardConfiguration : IEntityTypeConfiguration<PaymentCard>
{
    public void Configure(EntityTypeBuilder<PaymentCard> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Brand).HasMaxLength(50).IsRequired();
        builder.Property(p => p.LastFourDigits).HasMaxLength(4).IsRequired();
        builder.Property(p => p.ExpiryMonth).HasMaxLength(2).IsRequired();
        builder.Property(p => p.ExpiryYear).HasMaxLength(4).IsRequired();
        builder.Property(p => p.CardHolderName).HasMaxLength(200).IsRequired();
        builder.HasIndex(p => new { p.TenantId, p.IsDefault });
    }
}

public class ProductPurchaseConfiguration : IEntityTypeConfiguration<ProductPurchase>
{
    public void Configure(EntityTypeBuilder<ProductPurchase> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.ProductType).HasMaxLength(50).IsRequired();
        builder.Property(p => p.PlanName).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(p => p.TenantId);
        builder.HasOne(p => p.Receivable)
            .WithMany()
            .HasForeignKey(p => p.ReceivableId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.AuthorName).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Comment).HasMaxLength(2000);
        builder.HasIndex(r => r.BusinessId);
    }
}

public class UserAuthProviderConfiguration : IEntityTypeConfiguration<UserAuthProvider>
{
    public void Configure(EntityTypeBuilder<UserAuthProvider> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Provider).HasMaxLength(50).IsRequired();
        builder.Property(p => p.ProviderUserId).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Email).HasMaxLength(200);
        builder.Property(p => p.FullName).HasMaxLength(200);
        builder.Property(p => p.AvatarUrl).HasMaxLength(500);

        builder.HasIndex(p => new { p.Provider, p.ProviderUserId }).IsUnique();
        builder.HasIndex(p => p.UserId);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class QueueItemConfiguration : IEntityTypeConfiguration<QueueItem>
{
    public void Configure(EntityTypeBuilder<QueueItem> builder)
    {
        builder.HasKey(q => q.Id);
        builder.Property(q => q.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(q => q.CustomerPhone).HasMaxLength(20);
        builder.Property(q => q.Notes).HasMaxLength(500);
        builder.Property(q => q.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(q => new { q.BusinessId, q.QueueNumber });
        builder.HasIndex(q => q.TenantId);
    }
}

public class WaitingListEntryConfiguration : IEntityTypeConfiguration<WaitingListEntry>
{
    public void Configure(EntityTypeBuilder<WaitingListEntry> builder)
    {
        builder.HasKey(w => w.Id);
        builder.Property(w => w.CustomerName).HasMaxLength(200).IsRequired();
        builder.Property(w => w.CustomerPhone).HasMaxLength(20);
        builder.Property(w => w.Notes).HasMaxLength(500);
        builder.Property(w => w.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(w => w.TenantId);
    }
}

public class SurveyConfiguration : IEntityTypeConfiguration<Survey>
{
    public void Configure(EntityTypeBuilder<Survey> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.CustomerName).HasMaxLength(200);
        builder.Property(s => s.Comment).HasMaxLength(2000);
        builder.HasIndex(s => s.BusinessId);
        builder.HasIndex(s => s.AppointmentId);
        builder.HasIndex(s => s.TenantId);
    }
}

public class CustomFormConfiguration : IEntityTypeConfiguration<CustomForm>
{
    public void Configure(EntityTypeBuilder<CustomForm> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Title).HasMaxLength(200).IsRequired();
        builder.Property(f => f.Description).HasMaxLength(1000);
        builder.Property(f => f.Fields)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<FormField>>(v, (JsonSerializerOptions?)null) ?? new())
            .HasColumnType("jsonb");
        builder.HasIndex(f => f.TenantId);
    }
}

public class FormSubmissionConfiguration : IEntityTypeConfiguration<FormSubmission>
{
    public void Configure(EntityTypeBuilder<FormSubmission> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.CustomerName).HasMaxLength(200);
        builder.Property(s => s.CustomerPhone).HasMaxLength(20);
        builder.Property(s => s.Data)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new())
            .HasColumnType("jsonb");
        builder.HasIndex(s => s.FormId);
        builder.HasIndex(s => s.TenantId);
    }
}

public class SalesLeadConfiguration : IEntityTypeConfiguration<SalesLead>
{
    public void Configure(EntityTypeBuilder<SalesLead> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(l => l.ContactName).HasMaxLength(200).IsRequired();
        builder.Property(l => l.Phone).HasMaxLength(20).IsRequired();
        builder.Property(l => l.Email).HasMaxLength(200).IsRequired();
        builder.Property(l => l.Message).HasMaxLength(2000);
        builder.Property(l => l.PlanRequested).HasMaxLength(50);
        builder.Property(l => l.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(l => l.Status);
        builder.HasIndex(l => l.CreatedAt);
    }
}

public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Category).HasConversion<string>().HasMaxLength(20);
        builder.Property(f => f.Message).HasMaxLength(2000).IsRequired();
        builder.Property(f => f.ImageUrls).HasMaxLength(4000);
        builder.HasIndex(f => f.TenantId);
        builder.HasIndex(f => f.CreatedAt);
    }
}

public class PlatformPaymentConfiguration : IEntityTypeConfiguration<PlatformPayment>
{
    public void Configure(EntityTypeBuilder<PlatformPayment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.PayerName).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(500);
        builder.Property(p => p.Currency).HasMaxLength(10).IsRequired();
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.BillingAddress).HasMaxLength(500);
        builder.Property(p => p.BillingCity).HasMaxLength(100);
        builder.Property(p => p.BillingCountry).HasMaxLength(100);
        builder.Property(p => p.TaxNumber).HasMaxLength(50);
        builder.Property(p => p.TaxOffice).HasMaxLength(100);
        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => p.Type);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.CreatedAt);
    }
}

public class PricingPlanConfiguration : IEntityTypeConfiguration<PricingPlan>
{
    public void Configure(EntityTypeBuilder<PricingPlan> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.BadgeLabel).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(300).IsRequired();
        builder.Property(p => p.Price).HasColumnType("decimal(10,2)");
        builder.Property(p => p.ButtonText).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Features).HasColumnType("text[]");
        builder.Property(p => p.HighlightLabel).HasMaxLength(50);
        builder.Property(p => p.PlanKey).HasMaxLength(50);
    }
}

public class PricingPlanSlotConfiguration : IEntityTypeConfiguration<PricingPlanSlot>
{
    public void Configure(EntityTypeBuilder<PricingPlanSlot> builder)
    {
        builder.HasKey(s => s.Id);
        builder.HasIndex(s => s.SlotNumber).IsUnique();
    }
}
