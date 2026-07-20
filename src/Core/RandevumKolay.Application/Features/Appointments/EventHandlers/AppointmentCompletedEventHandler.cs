using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Features.Loyalty;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Events;

namespace RandevumKolay.Application.Features.Appointments.EventHandlers;

/// <summary>
/// Records the visit on the customer and awards loyalty points based on the
/// customer's current tier multiplier. Auto-enrolls the customer as a loyalty
/// member (0 points) on their first completed visit.
/// </summary>
public class AppointmentCompletedEventHandler : INotificationHandler<AppointmentCompletedEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<AppointmentCompletedEventHandler> _logger;

    public AppointmentCompletedEventHandler(
        IApplicationDbContext context,
        ILogger<AppointmentCompletedEventHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(AppointmentCompletedEvent notification, CancellationToken cancellationToken)
    {
        var appointment = notification.Appointment;

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == appointment.CustomerId, cancellationToken);
        if (customer is null)
            return;

        customer.RecordVisit(appointment.Price);

        var member = await _context.LoyaltyMembers
            .FirstOrDefaultAsync(m => m.TenantId == appointment.TenantId && m.CustomerId == customer.Id, cancellationToken);
        if (member is null)
        {
            member = LoyaltyMember.Create(appointment.TenantId, customer.Id);
            _context.LoyaltyMembers.Add(member);
        }

        var tiers = await LoyaltyTierHelper.GetOrSeedTiersAsync(_context, appointment.TenantId, cancellationToken);
        var currentTier = LoyaltyTierHelper.CurrentTier(tiers, member.Points);

        var pointsAwarded = (int)Math.Floor(appointment.Price / 10m) * currentTier.Multiplier;
        member.AddPoints((int)pointsAwarded);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Loyalty: {Points} puan eklendi (customer {CustomerId}, tenant {TenantId}).",
            (int)pointsAwarded, customer.Id, appointment.TenantId);
    }
}
