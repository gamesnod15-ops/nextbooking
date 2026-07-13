using FluentValidation;
using MediatR;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Services.Commands.CreateService;

public record CreateServiceCommand(
    string Name,
    string? Description,
    int DurationMinutes,
    decimal Price,
    int BufferMinutes,
    bool RequiresConfirmation,
    string? Color,
    string? ImageUrl,
    int? MaxCapacity) : IRequest<Guid>;

public sealed class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CreateServiceCommandHandler(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Guid> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var business = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .FirstOrDefaultAsync(
                _context.Businesses.Where(b => b.TenantId == _tenantService.TenantId),
                cancellationToken)
            ?? throw new InvalidOperationException("Business not found for tenant.");

        var service = Service.Create(
            _tenantService.TenantId,
            business.Id,
            request.Name,
            request.DurationMinutes,
            request.Price,
            request.BufferMinutes,
            request.Description);

        service.Update(request.Name, request.Description, request.DurationMinutes,
            request.Price, request.BufferMinutes, request.RequiresConfirmation);

        if (request.Color is not null)
            service.SetColor(request.Color);

        if (request.ImageUrl is not null)
            service.SetImage(request.ImageUrl);

        _context.Services.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        return service.Id;
    }
}

public class CreateServiceCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateServiceCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DurationMinutes).GreaterThan(0).LessThanOrEqualTo(480);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BufferMinutes).GreaterThanOrEqualTo(0);
    }
}
