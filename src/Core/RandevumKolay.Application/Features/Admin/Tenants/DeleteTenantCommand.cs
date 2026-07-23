using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Admin.Tenants;

public record DeleteTenantCommand(Guid TenantId) : IRequest;

public sealed class DeleteTenantCommandHandler : IRequestHandler<DeleteTenantCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteTenantCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteTenantCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants.FindAsync([request.TenantId], cancellationToken)
            ?? throw new KeyNotFoundException("İşletme bulunamadı.");

        var tenantId = tenant.Id;
        var conn = ((DbContext)_context).Database.GetDbConnection();
        await conn.OpenAsync(cancellationToken);

        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                DELETE FROM ""RefreshTokens"" WHERE ""UserId"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""TenantId"" = @tid);
                DELETE FROM ""UserAuthProviders"" WHERE ""UserId"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""TenantId"" = @tid);
                DELETE FROM ""Reviews"" WHERE ""BusinessId"" IN (SELECT ""Id"" FROM ""Businesses"" WHERE ""TenantId"" = @tid);

                DELETE FROM ""WinBackSendLogs"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WinBackRules"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WhatsAppMessages"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WhatsAppConversations"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WhatsAppBookingDrafts"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WhatsAppIntegrations"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Surveys"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""FormSubmissions"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""CustomForms"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""NoShowPredictions"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""LoyaltyRedemptions"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""LoyaltyRewards"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""LoyaltyMembers"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""LoyaltyTiers"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""AiUsageRecords"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""QueueItems"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""WaitingListEntries"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""ProductPurchases"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""PaymentCards"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Deposits"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""DebtRecords"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Installments"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Receivables"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Products"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""GiftCoupons"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Campaigns"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Coupons"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Packages"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""EmployeeCommissions"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Advertisements"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Branches"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""EmployeeServices"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Schedules"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""ScheduleExceptions"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Services"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Payments"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""AuditLogs"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""PlatformPayments"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Feedbacks"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Appointments"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Employees"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Customers"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Users"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Businesses"" WHERE ""TenantId"" = @tid;
                DELETE FROM ""Tenants"" WHERE ""Id"" = @tid;
            ";

            var param = cmd.CreateParameter();
            param.ParameterName = "@tid";
            param.Value = tenantId;
            cmd.Parameters.Add(param);

            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            await conn.CloseAsync();
        }
    }
}

public class DeleteTenantCommandValidator : AbstractValidator<DeleteTenantCommand>
{
    public DeleteTenantCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
    }
}
