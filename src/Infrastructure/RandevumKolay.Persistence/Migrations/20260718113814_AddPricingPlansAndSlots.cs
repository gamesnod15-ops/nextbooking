using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingPlansAndSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pricing_plan_slots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slot_number = table.Column<int>(type: "integer", nullable: false),
                    pricing_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_pricing_plan_slots", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pricing_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    badge_label = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    is_custom_pricing = table.Column<bool>(type: "boolean", nullable: false),
                    button_text = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    features = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_highlighted = table.Column<bool>(type: "boolean", nullable: false),
                    highlight_label = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    plan_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_pricing_plans", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_pricing_plan_slots_slot_number",
                table: "pricing_plan_slots",
                column: "slot_number",
                unique: true);

            // Exactly 4 fixed display slots — seeded once, never added to or removed from.
            migrationBuilder.Sql(@"
                INSERT INTO pricing_plan_slots (id, slot_number, pricing_plan_id, created_at, created_by, is_deleted)
                VALUES
                    (gen_random_uuid(), 1, NULL, now(), 'system', false),
                    (gen_random_uuid(), 2, NULL, now(), 'system', false),
                    (gen_random_uuid(), 3, NULL, now(), 'system', false),
                    (gen_random_uuid(), 4, NULL, now(), 'system', false);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pricing_plan_slots");

            migrationBuilder.DropTable(
                name: "pricing_plans");
        }
    }
}
