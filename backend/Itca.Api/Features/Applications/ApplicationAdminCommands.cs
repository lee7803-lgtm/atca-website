using Itca.Api.Data;
using Itca.Api.Features.Admin;
using Npgsql;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationAdminCommands(SupabaseDb database, AuditLogWriter auditLogs)
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
        AdminActorContext actor,
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
        var before = await GetReviewSnapshotAsync(connection, id, cancellationToken);
        if (before is null)
        {
            return null;
        }

        await using var command = connection.CreateCommand();
        var updatedAt = DateTimeOffset.UtcNow;
        var sequenceYear = updatedAt.Year;
        var issuedBy = string.IsNullOrWhiteSpace(actor.Email)
            ? string.IsNullOrWhiteSpace(actor.Name) ? "admin" : actor.Name
            : actor.Email;

        command.CommandText = """
            update applications
            set
              status = @status,
              admin_note = @adminNote,
              member_no = case
                when @status = 'approved' and member_no is null then public.generate_itca_number(@memberSequenceKey, @memberPrefix, @sequenceYear)
                else member_no
              end,
              member_no_issued_at = case
                when @status = 'approved' and member_no is null then @updatedAt
                else member_no_issued_at
              end,
              member_no_issued_by = case
                when @status = 'approved' and member_no is null then @issuedBy
                else member_no_issued_by
              end,
              updated_at = @updatedAt
            where id = @id
              and application_type in ('personal_member', 'organization_member')
            returning
              id,
              application_no,
              member_no,
              application_type,
              status,
              admin_note,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("status", status);
        command.Parameters.AddWithValue("adminNote", adminNote);
        command.Parameters.AddWithValue("updatedAt", updatedAt);
        command.Parameters.AddWithValue("issuedBy", issuedBy);
        command.Parameters.AddWithValue("sequenceYear", sequenceYear);
        command.Parameters.AddWithValue("memberSequenceKey", NumberingGenerator.GetMemberSequenceKey(before.ApplicationType, sequenceYear));
        command.Parameters.AddWithValue("memberPrefix", NumberingGenerator.GetMemberPrefix(before.ApplicationType));

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var updated = new ApplicationAdminReviewSummaryDto(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
            reader.GetString(3),
            reader.GetString(4),
            reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
            reader.GetFieldValue<DateTime>(6).ToString("O")
        );

        await reader.DisposeAsync();

        await auditLogs.WriteAsync(
            new AuditLogEntry(
                actor.AdminId,
                actor.Email,
                actor.Name,
                actor.Role,
                string.IsNullOrWhiteSpace(actor.ActorType) ? "legacy_admin" : actor.ActorType,
                "member_application.review_update",
                "application",
                updated.Id.ToString(),
                updated.ApplicationNo,
                before,
                new ApplicationReviewAuditSnapshot(
                    updated.Id,
                    updated.ApplicationNo,
                    updated.MemberNo,
                    updated.ApplicationType,
                    updated.Status,
                    updated.AdminNote,
                    updated.UpdatedAt
                ),
                $"会员申请 {updated.ApplicationNo} 审核状态更新为 {updated.Status}。",
                actor.IpAddress,
                actor.UserAgent
            ),
            cancellationToken
        );

        return updated;
    }

    private static async Task<ApplicationReviewAuditSnapshot?> GetReviewSnapshotAsync(
        NpgsqlConnection connection,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              id,
              application_no,
              member_no,
              application_type,
              status,
              admin_note,
              updated_at
            from applications
            where id = @id
              and application_type in ('personal_member', 'organization_member')
            limit 1;
            """;
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new ApplicationReviewAuditSnapshot(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
            reader.GetString(3),
            reader.GetString(4),
            reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
            reader.GetFieldValue<DateTime>(6).ToString("O")
        );
    }
}

public sealed class ApplicationAdminReviewValidationException(string message) : Exception(message);

public sealed record ApplicationReviewAuditSnapshot(
    Guid Id,
    string ApplicationNo,
    string MemberNo,
    string ApplicationType,
    string Status,
    string AdminNote,
    string UpdatedAt
);
