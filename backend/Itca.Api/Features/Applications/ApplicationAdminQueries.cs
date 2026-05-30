using System.Text.Json;
using Itca.Api.Data;
using Itca.Api.Features.Validity;
using Npgsql;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationAdminQueries(SupabaseDb database)
{
    private static readonly HashSet<string> ValidApplicationTypes = ["personal_member", "organization_member"];
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

    public async Task<IReadOnlyList<ApplicationAdminDto>> ListApplicationsAsync(
        string? applicationType,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        var conditions = new List<string>();
        if (!string.IsNullOrWhiteSpace(applicationType) && ValidApplicationTypes.Contains(applicationType))
        {
            conditions.Add("application_type = @applicationType");
            command.Parameters.AddWithValue("applicationType", applicationType);
        }

        if (!string.IsNullOrWhiteSpace(status) && ValidStatuses.Contains(status))
        {
            conditions.Add("status = @status");
            command.Parameters.AddWithValue("status", status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            conditions.Add("(application_no ilike @keyword or member_no ilike @keyword or name ilike @keyword or contact_name ilike @keyword or email ilike @keyword or phone ilike @keyword)");
            command.Parameters.AddWithValue("keyword", $"%{keyword}%");
        }

        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);
        command.Parameters.AddWithValue("limit", normalizedPageSize);
        command.Parameters.AddWithValue("offset", (normalizedPage - 1) * normalizedPageSize);

        command.CommandText = $"""
            select
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
              updated_at
            from applications
            {(conditions.Count > 0 ? $"where {string.Join(" and ", conditions)}" : string.Empty)}
            order by created_at desc
            limit @limit offset @offset;
            """;

        var applications = new List<ApplicationAdminDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            applications.Add(ReadApplicationForCommand(reader));
        }

        return applications;
    }

    public async Task<ApplicationAdminDto?> GetApplicationAsync(
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        command.CommandText = """
            select
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
              updated_at
            from applications
            where id = @id
            limit 1;
            """;
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadApplicationForCommand(reader) : null;
    }

    internal static ApplicationAdminDto ReadApplicationForCommand(NpgsqlDataReader reader)
    {
        var effective = ValidityCalculator.ForMember(
            GetNullableString(reader, 7, "active"),
            GetNullableString(reader, 8, "none"),
            GetDateOnlyOrNull(reader, 6),
            DateOnly.FromDateTime(DateTime.UtcNow)
        );

        return new ApplicationAdminDto(
            reader.GetGuid(0),
            reader.GetString(1),
            GetNullableString(reader, 2),
            GetTimestampStringOrNull(reader, 3),
            GetNullableString(reader, 4),
            GetDateStringOrNull(reader, 5),
            GetDateStringOrNull(reader, 6),
            GetNullableString(reader, 7, "active"),
            GetNullableString(reader, 8, "none"),
            GetTimestampStringOrNull(reader, 9),
            GetNullableString(reader, 10),
            effective.EffectiveStatus,
            effective.EffectiveStatusLabel,
            effective.DaysUntilExpiry,
            effective.ExpiryBucket,
            GetNullableString(reader, 11),
            reader.GetString(12),
            reader.GetString(13),
            reader.GetString(14),
            reader.GetString(15),
            GetNullableString(reader, 16),
            reader.GetString(17),
            reader.GetString(18),
            GetNullableStringOrNull(reader, 19),
            GetNullableString(reader, 20),
            GetNullableString(reader, 21),
            string.Empty,
            string.Empty,
            string.Empty,
            GetNullableBool(reader, 22),
            GetNullableBool(reader, 23),
            GetNullableBool(reader, 24),
            GetNullableBool(reader, 25),
            GetTimestampString(reader, 26),
            GetNullableString(reader, 27),
            GetJsonArray(reader, 28),
            GetTimestampStringOrNull(reader, 29),
            GetTimestampString(reader, 30),
            GetTimestampString(reader, 31)
        );
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal, string fallback)
    {
        return reader.IsDBNull(ordinal) ? fallback : reader.GetString(ordinal);
    }

    private static string? GetNullableStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static bool GetNullableBool(NpgsqlDataReader reader, int ordinal)
    {
        return !reader.IsDBNull(ordinal) && reader.GetBoolean(ordinal);
    }

    private static string GetTimestampString(NpgsqlDataReader reader, int ordinal)
    {
        return GetTimestampStringOrNull(reader, ordinal) ?? string.Empty;
    }

    private static string? GetTimestampStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return reader.GetFieldValue<DateTime>(ordinal).ToString("O");
    }

    private static DateOnly? GetDateOnlyOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetFieldValue<DateOnly>(ordinal);
    }

    private static string? GetDateStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return GetDateOnlyOrNull(reader, ordinal)?.ToString("yyyy-MM-dd");
    }

    private static JsonElement[] GetJsonArray(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return [];
        }

        using var document = JsonDocument.Parse(reader.GetString(ordinal));
        if (document.RootElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return document.RootElement.EnumerateArray().Select(item => item.Clone()).ToArray();
    }
}
