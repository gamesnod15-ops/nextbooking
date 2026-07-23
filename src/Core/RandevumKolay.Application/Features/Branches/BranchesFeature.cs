using MediatR;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Application.Common.Interfaces;
using RandevumKolay.Application.Common.Models;
using RandevumKolay.Domain.Entities;

namespace RandevumKolay.Application.Features.Branches;

public record BranchDto(Guid Id, string Name, string? Address, string? City, string? Phone,
    string? Email, string? ManagerName, bool IsActive, bool IsMainBranch, DateTimeOffset CreatedAt);

public record GetBranchesQuery(int PageNumber = 1, int PageSize = 50) : IRequest<PaginatedList<BranchDto>>;

public sealed class GetBranchesQueryHandler : IRequestHandler<GetBranchesQuery, PaginatedList<BranchDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public GetBranchesQueryHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<PaginatedList<BranchDto>> Handle(GetBranchesQuery request, CancellationToken ct)
    {
        var q = _context.Branches.AsNoTracking()
            .Where(b => b.TenantId == _tenant.TenantId)
            .OrderByDescending(b => b.IsMainBranch)
            .ThenBy(b => b.Name);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(b => new BranchDto(b.Id, b.Name, b.Address, b.City, b.Phone,
                b.Email, b.ManagerName, b.IsActive, b.IsMainBranch, b.CreatedAt))
            .ToListAsync(ct);
        return new PaginatedList<BranchDto>(items, total, request.PageNumber, request.PageSize);
    }
}

public record CreateBranchCommand(string Name, bool IsMainBranch, string? Address, string? City,
    string? Phone, string? Email, string? ManagerName) : IRequest<Guid>;

public sealed class CreateBranchCommandHandler : IRequestHandler<CreateBranchCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public CreateBranchCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task<Guid> Handle(CreateBranchCommand request, CancellationToken ct)
    {
        var branch = Branch.Create(_tenant.TenantId, request.Name, request.IsMainBranch,
            request.Address, request.City, request.Phone, request.Email, request.ManagerName);
        _context.Branches.Add(branch);
        await _context.SaveChangesAsync(ct);
        return branch.Id;
    }
}

public record UpdateBranchCommand(Guid Id, string Name, string? Address, string? City,
    string? Phone, string? Email, string? ManagerName, bool IsActive) : IRequest;

public sealed class UpdateBranchCommandHandler : IRequestHandler<UpdateBranchCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public UpdateBranchCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(UpdateBranchCommand request, CancellationToken ct)
    {
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Branch not found");
        branch.Update(request.Name, request.Address, request.City, request.Phone,
            request.Email, request.ManagerName);
        branch.SetActive(request.IsActive);
        await _context.SaveChangesAsync(ct);
    }
}

public record DeleteBranchCommand(Guid Id) : IRequest;

public sealed class DeleteBranchCommandHandler : IRequestHandler<DeleteBranchCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenant;
    public DeleteBranchCommandHandler(IApplicationDbContext context, ICurrentTenantService tenant)
    { _context = context; _tenant = tenant; }

    public async Task Handle(DeleteBranchCommand request, CancellationToken ct)
    {
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.TenantId == _tenant.TenantId, ct)
            ?? throw new Exception("Branch not found");
        _context.Branches.Remove(branch);
        await _context.SaveChangesAsync(ct);
    }
}
