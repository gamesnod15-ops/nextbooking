using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Application.Features.WhatsAppConversations.Queries.GetConversations;

public record GetConversationsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    ConversationStatus? Status = null,
    LeadTier? LeadTier = null) : IRequest<PaginatedList<ConversationDto>>;

public record ConversationDto(
    Guid Id,
    string CustomerPhone,
    string? CustomerName,
    Guid? CustomerId,
    ConversationStatus Status,
    int LeadScore,
    LeadTier LeadTier,
    string? EscalationReason,
    string? LastMessagePreview,
    DateTimeOffset LastMessageAt);

public sealed class GetConversationsQueryHandler : IRequestHandler<GetConversationsQuery, PaginatedList<ConversationDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public GetConversationsQueryHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<PaginatedList<ConversationDto>> Handle(GetConversationsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.WhatsAppConversations
            .AsNoTracking()
            .Where(c => c.TenantId == _tenantService.TenantId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(c => c.Status == request.Status.Value);

        if (request.LeadTier.HasValue)
            query = query.Where(c => c.LeadTier == request.LeadTier.Value);

        var projected = query
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => new ConversationDto(
                c.Id,
                c.CustomerPhone,
                c.CustomerName,
                c.CustomerId,
                c.Status,
                c.LeadScore,
                c.LeadTier,
                c.EscalationReason,
                c.Messages
                    .OrderByDescending(m => m.Sequence)
                    .Select(m => m.Text)
                    .FirstOrDefault(),
                c.LastMessageAt));

        return await PaginatedList<ConversationDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
