using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.WhatsAppBookingDrafts.Queries.GetBookingDrafts;

public record GetBookingDraftsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    BookingDraftStatus? Status = null) : IRequest<PaginatedList<BookingDraftDto>>;

public record BookingDraftDto(
    Guid Id,
    Guid ConversationId,
    string ServiceName,
    DateOnly Date,
    TimeOnly Time,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    BookingDraftStatus Status,
    string? RejectionReason,
    Guid? CreatedAppointmentId,
    DateTimeOffset CreatedAt);

public sealed class GetBookingDraftsQueryHandler : IRequestHandler<GetBookingDraftsQuery, PaginatedList<BookingDraftDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetBookingDraftsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<BookingDraftDto>> Handle(GetBookingDraftsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.WhatsAppBookingDrafts
            .AsNoTracking()
            .Where(d => d.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(d => d.Status == request.Status.Value);

        var projected = query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new BookingDraftDto(
                d.Id,
                d.ConversationId,
                d.ServiceName,
                d.Date,
                d.Time,
                d.CustomerName,
                d.CustomerPhone,
                d.CustomerEmail,
                d.Status,
                d.RejectionReason,
                d.CreatedAppointmentId,
                d.CreatedAt));

        return await PaginatedList<BookingDraftDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
