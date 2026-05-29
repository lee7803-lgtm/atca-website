using Itca.Api.Data;
using Itca.Api.Features.Admin;
using Npgsql;
using NpgsqlTypes;

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
    private static readonly HashSet<string> ValidMemberStatuses = ["active", "suspended", "revoked", "terminated"];
    private static readonly HashSet<string> ValidMemberRenewalStatuses = ["none", "pending_renewal", "renewed", "pending_review"];

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
        var memberNo = status == "approved" && string.IsNullOrWhiteSpace(before.MemberNo)
            ? await NumberingGenerator.GenerateUniquePublicNumberAsync(
                connection,
                NumberingGenerator.GetMemberPrefix(before.ApplicationType),
                sequenceYear,
                NumberingGenerator.PublicNumberTarget.MemberNo,
                cancellationToken
            )
            : string.Empty;

        command.CommandText = """
            update applications
            set
              status = @status,
              admin_note = @adminNote,
              member_no = case
                when @status = 'approved' and member_no is null and @memberNo <> '' then @memberNo
                else member_no
              end,
              member_no_issued_at = case
                when @status = 'approved' and member_no is null and @memberNo <> '' then @updatedAt
                else member_no_issued_at
              end,
              member_no_issued_by = case
                when @status = 'approved' and member_no is null and @memberNo <> '' then @issuedBy
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
        command.Parameters.AddWithValue("memberNo", memberNo);

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

    public async Task<ApplicationAdminDto?> UpdateMemberValidityAsync(
        Guid id,
        ApplicationMemberValidityRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new ApplicationAdminReviewValidationException("更新资料格式不正确。");
        }

        var memberStatus = NormalizeOrDefault(request.MemberStatus, "active");
        var renewalStatus = NormalizeOrDefault(request.MemberRenewalStatus, "none");
        if (!ValidMemberStatuses.Contains(memberStatus))
        {
            throw new ApplicationAdminReviewValidationException("请选择有效的会员状态。");
        }

        if (!ValidMemberRenewalStatuses.Contains(renewalStatus))
        {
            throw new ApplicationAdminReviewValidationException("请选择有效的续期状态。");
        }

        var validFrom = ParseDateOrNull(request.MemberValidFrom, "会员有效期开始日期格式不正确。");
        var validUntil = ParseDateOrNull(request.MemberValidUntil, "会员有效期截止日期格式不正确。");
        if (validFrom.HasValue && validUntil.HasValue && validUntil.Value < validFrom.Value)
        {
            throw new ApplicationAdminReviewValidationException("会员有效期截止日期不能早于开始日期。");
        }

        var lastRenewedAt = ParseDateTimeOrNull(request.LastRenewedAt, "最近续期时间格式不正确。");
        var note = request.MemberStatusNote?.Trim() ?? string.Empty;
        var updatedAt = DateTimeOffset.UtcNow;

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var before = await GetMemberValiditySnapshotAsync(connection, id, cancellationToken);
        if (before is null)
        {
            return null;
        }

        await using var command = connection.CreateCommand();
        command.CommandText = """
            update applications
            set
              member_valid_from = @memberValidFrom,
              member_valid_until = @memberValidUntil,
              member_status = @memberStatus,
              member_renewal_status = @memberRenewalStatus,
              last_renewed_at = @lastRenewedAt,
              member_status_note = @memberStatusNote,
              updated_at = @updatedAt
            where id = @id
              and application_type in ('personal_member', 'organization_member')
            returning
              id,
              application_no,
              member_no,
              member_no_issued_at,
              member_no_issued_by,
              member_valid_from,
              member_valid_until,
              member_status,
              member_renewal_status,
              last_renewed_at,
              member_status_note,
              application_no_scheme,
              application_type,
              status,
              name,
              contact_name,
              phone,
              email,
              country,
              organization_type,
              profile,
              purpose,
              receive_notice,
              truth_confirmed,
              terms_accepted,
              privacy_accepted,
              confirmed_at,
              admin_note,
              supplemental_submissions,
              supplement_submitted_at,
              created_at,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        AddNullableDateParameter(command, "memberValidFrom", validFrom);
        AddNullableDateParameter(command, "memberValidUntil", validUntil);
        command.Parameters.AddWithValue("memberStatus", memberStatus);
        command.Parameters.AddWithValue("memberRenewalStatus", renewalStatus);
        AddNullableTimestampParameter(command, "lastRenewedAt", lastRenewedAt);
        AddNullableTextParameter(command, "memberStatusNote", note);
        command.Parameters.AddWithValue("updatedAt", updatedAt);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var updated = ApplicationAdminQueries.ReadApplicationForCommand(reader);
        await reader.DisposeAsync();

        await auditLogs.WriteAsync(
            new AuditLogEntry(
                actor.AdminId,
                actor.Email,
                actor.Name,
                actor.Role,
                string.IsNullOrWhiteSpace(actor.ActorType) ? "legacy_admin" : actor.ActorType,
                "member_application.validity_update",
                "application",
                updated.Id.ToString(),
                updated.ApplicationNo,
                before,
                new ApplicationMemberValidityAuditSnapshot(
                    updated.Id,
                    updated.ApplicationNo,
                    updated.MemberNo,
                    updated.MemberValidFrom,
                    updated.MemberValidUntil,
                    updated.MemberStatus,
                    updated.MemberRenewalStatus,
                    updated.LastRenewedAt,
                    updated.MemberStatusNote
                ),
                $"会员申请 {updated.ApplicationNo} 有效期资料已更新。",
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

    private static async Task<ApplicationMemberValidityAuditSnapshot?> GetMemberValiditySnapshotAsync(
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
              member_valid_from,
              member_valid_until,
              member_status,
              member_renewal_status,
              last_renewed_at,
              member_status_note
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

        return new ApplicationMemberValidityAuditSnapshot(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
            GetDateStringOrNull(reader, 3),
            GetDateStringOrNull(reader, 4),
            reader.IsDBNull(5) ? "active" : reader.GetString(5),
            reader.IsDBNull(6) ? "none" : reader.GetString(6),
            GetTimestampStringOrNull(reader, 7),
            reader.IsDBNull(8) ? string.Empty : reader.GetString(8)
        );
    }

    private static string NormalizeOrDefault(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static DateOnly? ParseDateOrNull(string? value, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateOnly.TryParse(value.Trim(), out var parsed))
        {
            return parsed;
        }

        throw new ApplicationAdminReviewValidationException(errorMessage);
    }

    private static DateTimeOffset? ParseDateTimeOrNull(string? value, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateTimeOffset.TryParse(value.Trim(), out var parsed))
        {
            return parsed;
        }

        throw new ApplicationAdminReviewValidationException(errorMessage);
    }

    private static void AddNullableDateParameter(NpgsqlCommand command, string name, DateOnly? value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Date);
        parameter.Value = value.HasValue ? value.Value : DBNull.Value;
    }

    private static void AddNullableTimestampParameter(NpgsqlCommand command, string name, DateTimeOffset? value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.TimestampTz);
        parameter.Value = value.HasValue ? value.Value : DBNull.Value;
    }

    private static void AddNullableTextParameter(NpgsqlCommand command, string name, string value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Text);
        parameter.Value = string.IsNullOrWhiteSpace(value) ? DBNull.Value : value;
    }

    private static string? GetDateStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetFieldValue<DateOnly>(ordinal).ToString("yyyy-MM-dd");
    }

    private static string? GetTimestampStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetFieldValue<DateTime>(ordinal).ToString("O");
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

public sealed record ApplicationMemberValidityAuditSnapshot(
    Guid Id,
    string ApplicationNo,
    string MemberNo,
    string? MemberValidFrom,
    string? MemberValidUntil,
    string MemberStatus,
    string MemberRenewalStatus,
    string? LastRenewedAt,
    string MemberStatusNote
);
