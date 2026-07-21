using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppIntegrationAiUsageAndAutomation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "automation_step",
                table: "whatsapp_conversations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "pending_date",
                table: "whatsapp_conversations",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pending_name",
                table: "whatsapp_conversations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pending_phone",
                table: "whatsapp_conversations",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "pending_service_id",
                table: "whatsapp_conversations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pending_service_name",
                table: "whatsapp_conversations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "pending_time",
                table: "whatsapp_conversations",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "retry_count",
                table: "whatsapp_conversations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ai_usage_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    period_start = table.Column<DateOnly>(type: "date", nullable: false),
                    message_count = table.Column<int>(type: "integer", nullable: false),
                    input_tokens = table.Column<long>(type: "bigint", nullable: false),
                    output_tokens = table.Column<long>(type: "bigint", nullable: false),
                    estimated_cost_usd = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_modified_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_usage_records", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "whatsapp_integrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone_number_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    access_token = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_connected = table.Column<bool>(type: "boolean", nullable: false),
                    connected_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: false),
                    last_modified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_modified_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_whatsapp_integrations", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_ai_usage_records_tenant_id_period_start",
                table: "ai_usage_records",
                columns: new[] { "tenant_id", "period_start" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_integrations_tenant_id",
                table: "whatsapp_integrations",
                column: "tenant_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_usage_records");

            migrationBuilder.DropTable(
                name: "whatsapp_integrations");

            migrationBuilder.DropColumn(
                name: "automation_step",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_date",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_name",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_phone",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_service_id",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_service_name",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "pending_time",
                table: "whatsapp_conversations");

            migrationBuilder.DropColumn(
                name: "retry_count",
                table: "whatsapp_conversations");
        }
    }
}
