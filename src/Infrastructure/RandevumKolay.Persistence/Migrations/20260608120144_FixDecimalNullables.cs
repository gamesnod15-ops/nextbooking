using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixDecimalNullables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "customer_recommendations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recommendation_type = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    recommended_service_id = table.Column<Guid>(type: "uuid", nullable: true),
                    recommended_product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    relevance_score = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_viewed = table.Column<bool>(type: "boolean", nullable: false),
                    is_clicked = table.Column<bool>(type: "boolean", nullable: false),
                    is_converted = table.Column<bool>(type: "boolean", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("pk_customer_recommendations", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_recommendations_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_customer_recommendations_products_recommended_product_id",
                        column: x => x.recommended_product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_customer_recommendations_services_recommended_service_id",
                        column: x => x.recommended_service_id,
                        principalTable: "services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "deposits",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false, defaultValue: "TRY"),
                    status = table.Column<int>(type: "integer", nullable: false),
                    payment_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    payment_provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    provider_payment_id = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    refunded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("pk_deposits", x => x.id);
                    table.ForeignKey(
                        name: "fk_deposits_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "no_show_predictions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    probability = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    factors = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    requires_deposit = table.Column<bool>(type: "boolean", nullable: false),
                    recommended_deposit_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    actual_no_show = table.Column<bool>(type: "boolean", nullable: true),
                    predicted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("pk_no_show_predictions", x => x.id);
                    table.ForeignKey(
                        name: "fk_no_show_predictions_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_no_show_predictions_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_customer_id",
                table: "customer_recommendations",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_customer_id_recommendation_type_re",
                table: "customer_recommendations",
                columns: new[] { "customer_id", "recommendation_type", "relevance_score" });

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_recommendation_type",
                table: "customer_recommendations",
                column: "recommendation_type");

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_recommended_product_id",
                table: "customer_recommendations",
                column: "recommended_product_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_recommended_service_id",
                table: "customer_recommendations",
                column: "recommended_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_recommendations_tenant_id",
                table: "customer_recommendations",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_deposits_appointment_id",
                table: "deposits",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_deposits_status",
                table: "deposits",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_deposits_tenant_id",
                table: "deposits",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_no_show_predictions_appointment_id",
                table: "no_show_predictions",
                column: "appointment_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_no_show_predictions_customer_id",
                table: "no_show_predictions",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_no_show_predictions_risk_level",
                table: "no_show_predictions",
                column: "risk_level");

            migrationBuilder.CreateIndex(
                name: "ix_no_show_predictions_tenant_id",
                table: "no_show_predictions",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_recommendations");

            migrationBuilder.DropTable(
                name: "deposits");

            migrationBuilder.DropTable(
                name: "no_show_predictions");
        }
    }
}
