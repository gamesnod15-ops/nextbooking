using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RandevumKolay.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_urls",
                table: "feedbacks",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_urls",
                table: "feedbacks");
        }
    }
}
