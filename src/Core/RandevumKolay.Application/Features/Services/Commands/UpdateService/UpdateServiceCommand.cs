using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;

namespace RandevumKolay.Application.Features.Services.Commands.UpdateService;

public record UpdateServiceCommand(
    Guid Id,
    string Name,
    string? Description,
    int DurationMinutes,
    decimal Price,
    int BufferMinutes,
    bool RequiresConfirmation,
    bool IsActive,
    string? Color,
    string? ImageUrl) : IRequest;

public sealed class UpdateServiceCommandHandler : IRequestHandler<UpdateServiceCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public UpdateServiceCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.TenantId == _tenantService.TenantId, cancellationToken)
            ?? throw new KeyNotFoundException($"Service {request.Id} not found.");

        service.Update(request.Name, request.Description, request.DurationMinutes,
            request.Price, request.BufferMinutes, request.RequiresConfirmation);

        service.SetActive(request.IsActive);

        if (request.Color is not null)
            service.SetColor(request.Color);

        if (request.ImageUrl is not null)
            service.SetImage(request.ImageUrl);

        await _context.SaveChangesAsync(cancellationToken);
    }
}

public class UpdateServiceCommandValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DurationMinutes).GreaterThan(0).LessThanOrEqualTo(480);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BufferMinutes).GreaterThanOrEqualTo(0);
    }
}
