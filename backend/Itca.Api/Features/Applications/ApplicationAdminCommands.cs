using Itca.Api.Data;
using Npgsql;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationAdminCommands(SupabaseDb database)
{
    private static readonly HashSet<string> ValidStatuses =
    [
        "submitted",
        "pending_review",
        "under_review",
        "need_more_info",
        "approved",
        "rejected",
        "archived"
    ];

    public async Task<ApplicationAdminReviewSummaryDto?> UpdateReviewAsync(
        Guid id,
        ApplicationAdminReviewRequest? request,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new ApplicationAdminReviewValidationException("更新资料格式不正确。");
        }

        var status = request.Status?.Trim() ?? string.Empty;
        if (!ValidStatuses.Contains(status))
        {
            throw new ApplicationAdminReviewValidationException("请选择有效的申请状态。");
        }

        var adminNote = request.AdminNote?.Trim() ?? string.Empty;
        if (status == "need_more_info" && string.IsNullOrWhiteSpace(adminNote))
        {
            throw new ApplicationAdminReviewValidationException("请填写需要申请人补充或修正的资料说明。");
        }

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            update applications
            set
              status = @status,
              admin_note = @adminNote,
              updated_at = @updatedAt
            where id = @id
              and application_type in ('personal_member', 'organization_member')
            returning
              id,
              application_no,
              application_type,
              status,
              admin_note,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("status", status);
        command.Parameters.AddWithValue("adminNote", adminNote);
        command.Parameters.AddWithValue("updatedAt", DateTime.UtcNow);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new ApplicationAdminReviewSummaryDto(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
            reader.GetFieldValue<DateTime>(5).ToString("O")
        );
    }
}

public sealed class ApplicationAdminReviewValidationException(string message) : Exception(message);
