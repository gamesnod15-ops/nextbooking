using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "whatsapp_conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    customer_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    lead_score = table.Column<int>(type: "integer", nullable: false),
                    lead_tier = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    escalation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    last_message_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("pk_whatsapp_conversations", x => x.id);
                    table.ForeignKey(
                        name: "fk_whatsapp_conversations_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "whatsapp_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    extracted_data_json = table.Column<string>(type: "jsonb", nullable: true),
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
                    table.PrimaryKey("pk_whatsapp_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_whatsapp_messages_whatsapp_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "whatsapp_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_conversations_customer_id",
                table: "whatsapp_conversations",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_conversations_status",
                table: "whatsapp_conversations",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_conversations_tenant_id",
                table: "whatsapp_conversations",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_conversations_tenant_id_customer_phone",
                table: "whatsapp_conversations",
                columns: new[] { "tenant_id", "customer_phone" });

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_messages_conversation_id",
                table: "whatsapp_messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "ix_whatsapp_messages_tenant_id",
                table: "whatsapp_messages",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "whatsapp_messages");

            migrationBuilder.DropTable(
                name: "whatsapp_conversations");
        }
    }
}
