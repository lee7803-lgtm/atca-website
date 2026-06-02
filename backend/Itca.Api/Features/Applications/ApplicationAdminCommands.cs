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
    private static readonly HashSet<string> ValidMemberRenewalStatuses = ["none", "pending_renewal", "renewal_in_progress", "renewed"];
    private static readonly HashSet<string> ValidRecordDispositions = ["normal", "test", "archived", "voided"];
    private static readonly string[] ContactConflictStatuses =
    [
        "submitted",
        "pending_review",
        "under_review",
        "need_more_info",
        "approved"
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
        var approvalDate = DateOnly.FromDateTime(updatedAt.UtcDateTime);
        var defaultMemberValidFrom = status == "approved" && string.IsNullOrWhiteSpace(before.MemberValidFrom)
            ? approvalDate
            : (DateOnly?)null;
        var defaultMemberValidUntil = status == "approved" && string.IsNullOrWhiteSpace(before.MemberValidUntil)
            ? approvalDate.AddYears(1).AddDays(-1)
            : (DateOnly?)null;
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
              member_valid_from = case
                when @status = 'approved' and member_valid_from is null and @defaultMemberValidFrom is not null then @defaultMemberValidFrom
                else member_valid_from
              end,
              member_valid_until = case
                when @status = 'approved' and member_valid_until is null and @defaultMemberValidUntil is not null then @defaultMemberValidUntil
                else member_valid_until
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
              member_valid_from,
              member_valid_until,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("status", status);
        command.Parameters.AddWithValue("adminNote", adminNote);
        command.Parameters.AddWithValue("updatedAt", updatedAt);
        command.Parameters.AddWithValue("issuedBy", issuedBy);
        command.Parameters.AddWithValue("memberNo", memberNo);
        AddNullableDateParameter(command, "defaultMemberValidFrom", defaultMemberValidFrom);
        AddNullableDateParameter(command, "defaultMemberValidUntil", defaultMemberValidUntil);

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
            reader.GetFieldValue<DateTime>(8).ToString("O")
        );
        var after = new ApplicationReviewAuditSnapshot(
            updated.Id,
            updated.ApplicationNo,
            updated.MemberNo,
            updated.ApplicationType,
            updated.Status,
            updated.AdminNote,
            GetDateStringOrNull(reader, 6),
            GetDateStringOrNull(reader, 7),
            updated.UpdatedAt
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
                after,
                $"会员申请 {updated.ApplicationNo} 审核状态更新为 {updated.Status}。",
                actor.IpAddress,
                actor.UserAgent
            ),
            cancellationToken
        );

        return updated;
    }

    public async Task<ApplicationAdminReviewSummaryDto?> UpdateAdminNoteAsync(
        Guid id,
        ApplicationAdminNoteRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new ApplicationAdminReviewValidationException("更新资料格式不正确。");
        }

        var adminNote = request.AdminNote?.Trim() ?? string.Empty;
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var before = await GetReviewSnapshotAsync(connection, id, cancellationToken);
        if (before is null)
        {
            return null;
        }

        await using var command = connection.CreateCommand();
        var updatedAt = DateTimeOffset.UtcNow;
        command.CommandText = """
            update applications
            set
              admin_note = @adminNote,
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
        command.Parameters.AddWithValue("adminNote", adminNote);
        command.Parameters.AddWithValue("updatedAt", updatedAt);

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
                "member_application.material_review_update",
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
                    before.MemberValidFrom,
                    before.MemberValidUntil,
                    updated.UpdatedAt
                ),
                $"会员申请 {updated.ApplicationNo} 资料审核记录已更新。",
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
              record_disposition,
              record_disposition_note,
              record_disposition_at,
              record_disposition_by,
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

    public async Task<ApplicationAdminDto?> UpdateRecordDispositionAsync(
        Guid id,
        ApplicationRecordDispositionRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new ApplicationAdminReviewValidationException("更新资料格式不正确。");
        }

        var disposition = NormalizeOrDefault(request.RecordDisposition, "normal");
        if (!ValidRecordDispositions.Contains(disposition))
        {
            throw new ApplicationAdminReviewValidationException("请选择有效的记录类型。");
        }

        var note = request.RecordDispositionNote?.Trim() ?? string.Empty;
        var updatedAt = DateTimeOffset.UtcNow;
        var actorLabel = string.IsNullOrWhiteSpace(actor.Email)
            ? string.IsNullOrWhiteSpace(actor.Name) ? "admin" : actor.Name
            : actor.Email;

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var before = await GetRecordDispositionSnapshotAsync(connection, id, cancellationToken);
        if (before is null)
        {
            return null;
        }

        await using var command = connection.CreateCommand();
        command.CommandText = """
            update applications
            set
              record_disposition = @recordDisposition,
              record_disposition_note = @recordDispositionNote,
              record_disposition_at = @updatedAt,
              record_disposition_by = @actor,
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
              record_disposition,
              record_disposition_note,
              record_disposition_at,
              record_disposition_by,
              supplemental_submissions,
              supplement_submitted_at,
              created_at,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("recordDisposition", disposition);
        AddNullableTextParameter(command, "recordDispositionNote", note);
        command.Parameters.AddWithValue("updatedAt", updatedAt);
        command.Parameters.AddWithValue("actor", actorLabel);

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
                "application.record_disposition_update",
                "application",
                updated.Id.ToString(),
                updated.ApplicationNo,
                before,
                new ApplicationRecordDispositionAuditSnapshot(
                    updated.Id,
                    updated.ApplicationNo,
                    updated.RecordDisposition,
                    updated.RecordDispositionNote,
                    updated.RecordDispositionAt,
                    updated.RecordDispositionBy
                ),
                $"会员申请 {updated.ApplicationNo} 记录类型更新为 {updated.RecordDisposition}。",
                actor.IpAddress,
                actor.UserAgent
            ),
            cancellationToken
        );

        return updated;
    }

    public async Task<ApplicationAdminDto?> UpdateContactAsync(
        Guid id,
        ApplicationContactUpdateRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new ApplicationAdminReviewValidationException("更新资料格式不正确。");
        }

        var name = NormalizeOrDefault(request.Name, string.Empty);
        var contactName = NormalizeOrDefault(request.ContactName, string.Empty);
        var phone = NormalizeOrDefault(request.Phone, string.Empty);
        var email = NormalizeOrDefault(request.Email, string.Empty);
        var country = NormalizeOrDefault(request.Country, string.Empty);
        var organizationType = NormalizeOrDefault(request.OrganizationType, string.Empty);
        var correctionNote = NormalizeOrDefault(request.CorrectionNote, string.Empty);

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ApplicationAdminReviewValidationException("请填写姓名 / 机构名称。");
        }
        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new ApplicationAdminReviewValidationException("请填写手机或 WhatsApp。");
        }
        if (!IsEmail(email))
        {
            throw new ApplicationAdminReviewValidationException("请填写有效邮箱。");
        }
        if (string.IsNullOrWhiteSpace(country))
        {
            throw new ApplicationAdminReviewValidationException("请填写国家 / 地区。");
        }
        if (string.IsNullOrWhiteSpace(correctionNote))
        {
            throw new ApplicationAdminReviewValidationException("请填写修正原因。");
        }

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var before = await GetContactSnapshotAsync(connection, id, cancellationToken);
        if (before is null)
        {
            return null;
        }
        if (before.RecordDisposition == "voided")
        {
            throw new ApplicationAdminReviewValidationException("记录已作废，不允许修改联系方式。");
        }
        if (before.RecordDisposition == "normal" && await HasContactConflictAsync(connection, id, before.ApplicationType, email, phone, cancellationToken))
        {
            throw new ApplicationAdminReviewValidationException("邮箱或手机号已被其他正常有效记录占用。");
        }

        var updatedAt = DateTimeOffset.UtcNow;
        await using var command = connection.CreateCommand();
        command.CommandText = """
            update applications
            set
              name = @name,
              contact_name = @contactName,
              phone = @phone,
              email = @email,
              country = @country,
              organization_type = @organizationType,
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
              record_disposition,
              record_disposition_note,
              record_disposition_at,
              record_disposition_by,
              supplemental_submissions,
              supplement_submitted_at,
              created_at,
              updated_at;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("contactName", string.IsNullOrWhiteSpace(contactName) ? name : contactName);
        command.Parameters.AddWithValue("phone", phone);
        command.Parameters.AddWithValue("email", email);
        command.Parameters.AddWithValue("country", country);
        AddNullableTextParameter(command, "organizationType", organizationType);
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
                "application.contact_update",
                "application",
                updated.Id.ToString(),
                updated.ApplicationNo,
                before,
                new ApplicationContactAuditSnapshot(
                    updated.Id,
                    updated.ApplicationNo,
                    updated.ApplicationType,
                    updated.Name,
                    updated.ContactName,
                    updated.Phone,
                    updated.Email,
                    updated.Country,
                    updated.OrganizationType,
                    updated.RecordDisposition,
                    correctionNote
                ),
                $"会员申请 {updated.ApplicationNo} 基础联系方式已修正。",
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
              member_valid_from,
              member_valid_until,
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
            GetDateStringOrNull(reader, 6),
            GetDateStringOrNull(reader, 7),
            reader.GetFieldValue<DateTime>(8).ToString("O")
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

    private static async Task<ApplicationRecordDispositionAuditSnapshot?> GetRecordDispositionSnapshotAsync(
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
              coalesce(record_disposition, 'normal'),
              record_disposition_note,
              record_disposition_at,
              record_disposition_by
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

        return new ApplicationRecordDispositionAuditSnapshot(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? "normal" : reader.GetString(2),
            reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
            GetTimestampStringOrNull(reader, 4),
            reader.IsDBNull(5) ? string.Empty : reader.GetString(5)
        );
    }

    private static async Task<ApplicationContactAuditSnapshot?> GetContactSnapshotAsync(
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
              application_type,
              name,
              contact_name,
              phone,
              email,
              country,
              organization_type,
              coalesce(record_disposition, 'normal')
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

        return new ApplicationContactAuditSnapshot(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3),
            reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
            reader.GetString(5),
            reader.GetString(6),
            reader.GetString(7),
            reader.IsDBNull(8) ? null : reader.GetString(8),
            reader.IsDBNull(9) ? "normal" : reader.GetString(9),
            string.Empty
        );
    }

    private static async Task<bool> HasContactConflictAsync(
        NpgsqlConnection connection,
        Guid id,
        string applicationType,
        string email,
        string phone,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select 1
            from applications
            where id <> @id
              and application_type = @applicationType
              and coalesce(record_disposition, 'normal') = 'normal'
              and status = any(@statuses)
              and (email = @email or phone = @phone)
            limit 1;
            """;
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("applicationType", applicationType);
        command.Parameters.AddWithValue("statuses", ContactConflictStatuses);
        command.Parameters.AddWithValue("email", email);
        command.Parameters.AddWithValue("phone", phone);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is not null;
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

    private static bool IsEmail(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var at = value.IndexOf('@');
        var dot = value.LastIndexOf('.');
        return at > 0 && dot > at + 1 && dot < value.Length - 1 && !value.Any(char.IsWhiteSpace);
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
    string? MemberValidFrom,
    string? MemberValidUntil,
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

public sealed record ApplicationRecordDispositionAuditSnapshot(
    Guid Id,
    string ApplicationNo,
    string RecordDisposition,
    string RecordDispositionNote,
    string? RecordDispositionAt,
    string RecordDispositionBy
);

public sealed record ApplicationContactAuditSnapshot(
    Guid Id,
    string ApplicationNo,
    string ApplicationType,
    string Name,
    string ContactName,
    string Phone,
    string Email,
    string Country,
    string? OrganizationType,
    string RecordDisposition,
    string CorrectionNote
);
