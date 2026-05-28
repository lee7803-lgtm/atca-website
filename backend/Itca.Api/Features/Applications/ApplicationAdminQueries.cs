using System.Text.Json;
using Itca.Api.Data;
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
            applications.Add(ReadApplication(reader));
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
        return await reader.ReadAsync(cancellationToken) ? ReadApplication(reader) : null;
    }

    private static ApplicationAdminDto ReadApplication(NpgsqlDataReader reader)
    {
        return new ApplicationAdminDto(
            reader.GetGuid(0),
            reader.GetString(1),
            GetNullableString(reader, 2),
            GetTimestampStringOrNull(reader, 3),
            GetNullableString(reader, 4),
            GetNullableString(reader, 5),
            reader.GetString(6),
            reader.GetString(7),
            reader.GetString(8),
            reader.GetString(9),
            GetNullableString(reader, 10),
            reader.GetString(11),
            reader.GetString(12),
            GetNullableStringOrNull(reader, 13),
            GetNullableString(reader, 14),
            GetNullableString(reader, 15),
            GetNullableBool(reader, 16),
            GetNullableBool(reader, 17),
            GetNullableBool(reader, 18),
            GetNullableBool(reader, 19),
            GetTimestampString(reader, 20),
            GetNullableString(reader, 21),
            GetJsonArray(reader, 22),
            GetTimestampStringOrNull(reader, 23),
            GetTimestampString(reader, 24),
            GetTimestampString(reader, 25)
        );
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
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
