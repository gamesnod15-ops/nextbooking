using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppBookingDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "whatsapp_booking_drafts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    customer_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    customer_phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    customer_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    rejection_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_whatsapp_booking_drafts", x => x.id);
                    table.ForeignKey(
                        name: "fk_whatsapp_booking_drafts_whats_app_conversations_conversatio",
                        column: x => x.conversation_id,
                        principalTable: "whatsapp_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_booking_drafts_conversation_id",
                table: "whatsapp_booking_drafts",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_booking_drafts_status",
                table: "whatsapp_booking_drafts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_booking_drafts_tenant_id",
                table: "whatsapp_booking_drafts",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "whatsapp_booking_drafts");
        }
    }
}
