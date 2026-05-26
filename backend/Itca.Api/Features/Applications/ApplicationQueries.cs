using Itca.Api.Data;
using Npgsql;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationQueries(SupabaseDb database)
{
    public async Task<ApplicationProgressDto?> FindApplicationProgressAsync(
        string applicationNo,
        string contact,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);

        var memberApplication = await FindMemberApplicationAsync(connection, applicationNo, contact, cancellationToken);
        if (memberApplication is not null)
        {
            return memberApplication;
        }

        return await FindCertificationApplicationAsync(connection, applicationNo, contact, cancellationToken);
    }

    private static async Task<ApplicationProgressDto?> FindMemberApplicationAsync(
        NpgsqlConnection connection,
        string applicationNo,
        string contact,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              application_no,
              application_type,
              name,
              status,
              admin_note,
              contact_name,
              phone,
              email,
              country,
              organization_type,
              profile,
              purpose,
              coalesce(jsonb_array_length(supplemental_submissions), 0) as supplemental_submission_count,
              supplement_submitted_at,
              created_at,
              updated_at
            from applications
            where application_no = @applicationNo
              and (email = @contact or phone = @contact)
            limit 1;
            """;
        command.Parameters.AddWithValue("applicationNo", applicationNo);
        command.Parameters.AddWithValue("contact", contact);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadMemberApplication(reader);
    }

    private static async Task<ApplicationProgressDto?> FindCertificationApplicationAsync(
        NpgsqlConnection connection,
        string applicationNo,
        string contact,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              ca.id,
              ca.application_no,
              ca.applicant_name,
              ca.status,
              ca.review_note,
              ca.applicant_feedback,
              ca.delivery_status,
              ca.delivered_at,
              coalesce(jsonb_array_length(ca.supplemental_submissions), 0) as supplemental_submission_count,
              ca.supplement_submitted_at,
              ca.created_at,
              ca.updated_at,
              ca.applicant_name_en,
              ca.taoist_name,
              ca.gender,
              ca.birth_date,
              ca.nationality,
              ca.residence,
              ca.phone,
              ca.email,
              ca.address,
              ca.master_name,
              ca.master_taoist_name,
              ca.lineage,
              ca.temple_or_organization,
              ca.sect,
              ca.practice_years,
              ca.experience_summary,
              ca.application_reason,
              ca.additional_note,
              ca.recommender_name,
              ca.recommender_contact,
              ca.recommender_relation,
              ca.certificate_photo_path,
              c.certificate_no,
              c.holder_name,
              c.taoist_name,
              c.taoist_rank,
              c.certification_path,
              c.certification_level,
              c.lineage_or_temple,
              c.sect,
              c.issued_date,
              c.valid_from,
              c.valid_until,
              c.status,
              c.certificate_photo_path
            from certification_applications ca
            left join certificates c on c.application_id = ca.id
            where ca.application_no = @applicationNo
              and (ca.email = @contact or ca.phone = @contact)
            order by c.created_at desc nulls last
            limit 1;
            """;
        command.Parameters.AddWithValue("applicationNo", applicationNo);
        command.Parameters.AddWithValue("contact", contact);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadCertificationApplication(reader);
    }

    private static ApplicationProgressDto ReadMemberApplication(NpgsqlDataReader reader)
    {
        var status = reader.GetString(3);

        return new ApplicationProgressDto(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            status,
            GetNullableString(reader, 4),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            GetTimestampString(reader, 13),
            reader.GetInt32(12) > 0,
            status == "need_more_info"
                ? new Dictionary<string, string>
                {
                    ["name"] = reader.GetString(2),
                    ["contactName"] = GetNullableString(reader, 5),
                    ["phone"] = GetNullableString(reader, 6),
                    ["email"] = GetNullableString(reader, 7),
                    ["country"] = GetNullableString(reader, 8),
                    ["profile"] = GetNullableString(reader, 10),
                    ["purpose"] = GetNullableString(reader, 11),
                    ["organizationType"] = GetNullableString(reader, 9)
                }
                : null,
            GetTimestampString(reader, 14),
            GetTimestampString(reader, 15)
        );
    }

    private static ApplicationProgressDto ReadCertificationApplication(NpgsqlDataReader reader)
    {
        var status = reader.GetString(3);
        var certificateNo = GetNullableString(reader, 34);
        var applicationPhotoPath = GetNullableString(reader, 33);
        var certificatePhotoPath = GetNullableString(reader, 46);

        return new ApplicationProgressDto(
            reader.GetString(1),
            "taoist_certification",
            reader.GetString(2),
            status,
            GetNullableString(reader, 5, GetNullableString(reader, 4)),
            string.IsNullOrWhiteSpace(certificateNo) ? null : certificateNo,
            string.IsNullOrWhiteSpace(certificateNo) ? null : $"/certificates/{Uri.EscapeDataString(certificateNo)}",
            GetNullableStringOrNull(reader, 45),
            GetNullableStringOrNull(reader, 35),
            GetNullableStringOrNull(reader, 36),
            GetNullableStringOrNull(reader, 38),
            string.IsNullOrWhiteSpace(certificateNo)
                ? null
                : FormatCertificationLevel(GetNullableString(reader, 39), GetNullableString(reader, 37, "道士资格认证")),
            GetCertificationLineageOrTemple(reader),
            string.IsNullOrWhiteSpace(certificateNo) ? null : "ITCA / 国际道教与文化协会",
            GetDateStringOrNull(reader, 42),
            GetDateStringOrNull(reader, 43),
            GetDateStringOrNull(reader, 44),
            string.IsNullOrWhiteSpace(certificateNo) ? null : !string.IsNullOrWhiteSpace(certificatePhotoPath) || !string.IsNullOrWhiteSpace(applicationPhotoPath),
            reader.GetString(6) == "delivered" ? "delivered" : "not_delivered",
            GetTimestampString(reader, 7),
            GetTimestampString(reader, 9),
            reader.GetInt32(8) > 0,
            status == "need_more_info" ? GetCertificationEditableData(reader) : null,
            GetTimestampString(reader, 10),
            GetTimestampString(reader, 11)
        );
    }

    private static Dictionary<string, string> GetCertificationEditableData(NpgsqlDataReader reader)
    {
        return new Dictionary<string, string>
        {
            ["applicantName"] = reader.GetString(2),
            ["applicantNameEn"] = GetNullableString(reader, 12),
            ["taoistName"] = GetNullableString(reader, 13),
            ["gender"] = GetNullableString(reader, 14),
            ["birthDate"] = GetDateString(reader, 15),
            ["nationality"] = GetNullableString(reader, 16),
            ["residence"] = GetNullableString(reader, 17),
            ["phone"] = GetNullableString(reader, 18),
            ["email"] = GetNullableString(reader, 19),
            ["address"] = GetNullableString(reader, 20),
            ["masterName"] = GetNullableString(reader, 21),
            ["masterTaoistName"] = GetNullableString(reader, 22),
            ["lineage"] = GetNullableString(reader, 23),
            ["templeOrOrganization"] = GetNullableString(reader, 24),
            ["sect"] = GetNullableString(reader, 25),
            ["practiceYears"] = GetNullableString(reader, 26),
            ["experienceSummary"] = GetNullableString(reader, 27),
            ["applicationReason"] = GetNullableString(reader, 28),
            ["additionalNote"] = GetNullableString(reader, 29),
            ["recommenderName"] = GetNullableString(reader, 30),
            ["recommenderContact"] = GetNullableString(reader, 31),
            ["recommenderRelation"] = GetNullableString(reader, 32)
        };
    }

    private static string? GetCertificationLineageOrTemple(NpgsqlDataReader reader)
    {
        var certificateNo = GetNullableString(reader, 34);
        if (string.IsNullOrWhiteSpace(certificateNo))
        {
            return null;
        }

        var lineageOrTemple = GetNullableString(reader, 40);
        return string.IsNullOrWhiteSpace(lineageOrTemple) ? GetNullableStringOrNull(reader, 41) : lineageOrTemple;
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        return reader.IsDBNull(ordinal) ? fallback : reader.GetString(ordinal);
    }

    private static string? GetNullableStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static string GetDateString(NpgsqlDataReader reader, int ordinal)
    {
        return GetDateStringOrNull(reader, ordinal) ?? string.Empty;
    }

    private static string? GetDateStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return reader.GetFieldValue<DateOnly>(ordinal).ToString("yyyy-MM-dd");
    }

    private static string GetTimestampString(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return string.Empty;
        }

        return reader.GetFieldValue<DateTime>(ordinal).ToString("O");
    }

    private static string FormatCertificationLevel(string level, string fallback)
    {
        return level switch
        {
            "refuge_entry" => "皈依 / 入道确认",
            "transmission_or_crowning" => "传度 / 冠巾资格确认",
            "register_or_precept" => "授箓 / 传戒资格确认",
            "senior_taoist" => "高道 / 资深道职确认",
            "special_lineage" => "其他特殊传承说明",
            _ => fallback
        };
    }
}
