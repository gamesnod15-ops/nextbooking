using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeFavoriteUserOptionalAddDeviceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_favorites_user_id_business_id",
                table: "favorites");

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "favorites",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "device_id",
                table: "favorites",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_favorites_device_id_business_id",
                table: "favorites",
                columns: new[] { "device_id", "business_id" },
                unique: true,
                filter: "\"device_id\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_favorites_user_id_business_id",
                table: "favorites",
                columns: new[] { "user_id", "business_id" },
                unique: true,
                filter: "\"user_id\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_favorites_device_id_business_id",
                table: "favorites");

            migrationBuilder.DropIndex(
                name: "ix_favorites_user_id_business_id",
                table: "favorites");

            migrationBuilder.DropColumn(
                name: "device_id",
                table: "favorites");

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "favorites",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_favorites_user_id_business_id",
                table: "favorites",
                columns: new[] { "user_id", "business_id" },
                unique: true);
        }
    }
}
