using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPushTokensAndClientErrorLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "client_error_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    stack = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    component_stack = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    scope = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    platform = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    os_version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    app_version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    app_env = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    device_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client_error_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "push_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    token = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    platform = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_push_tokens", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_client_error_logs_created_at",
                table: "client_error_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_push_tokens_device_id",
                table: "push_tokens",
                column: "device_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_push_tokens_user_id",
                table: "push_tokens",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "client_error_logs");

            migrationBuilder.DropTable(
                name: "push_tokens");
        }
    }
}
