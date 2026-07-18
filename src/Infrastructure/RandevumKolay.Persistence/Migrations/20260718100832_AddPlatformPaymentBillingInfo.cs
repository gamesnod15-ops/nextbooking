using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformPaymentBillingInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "billing_address",
                table: "platform_payments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "billing_city",
                table: "platform_payments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "billing_country",
                table: "platform_payments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tax_number",
                table: "platform_payments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tax_office",
                table: "platform_payments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "billing_address",
                table: "platform_payments");

            migrationBuilder.DropColumn(
                name: "billing_city",
                table: "platform_payments");

            migrationBuilder.DropColumn(
                name: "billing_country",
                table: "platform_payments");

            migrationBuilder.DropColumn(
                name: "tax_number",
                table: "platform_payments");

            migrationBuilder.DropColumn(
                name: "tax_office",
                table: "platform_payments");
        }
    }
}
