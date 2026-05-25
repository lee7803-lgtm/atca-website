using Itca.Api.Data;
using Npgsql;

namespace Itca.Api.Features.Certificates;

public sealed class CertificateQueries(SupabaseDb database)
{
    public async Task<CertificatePublicDto?> FindPublicCertificateAsync(
        string certificateNo,
        string holderName,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        command.CommandText = """
            select
              certificate_no,
              holder_name,
              taoist_rank,
              certification_path,
              certification_level,
              issued_date,
              valid_from,
              valid_until,
              status
            from certificates
            where certificate_no = @certificateNo
              and holder_name = @holderName
              and public_query_enabled = true
              and status = 'valid'
            limit 1;
            """;
        command.Parameters.AddWithValue("certificateNo", certificateNo);
        command.Parameters.AddWithValue("holderName", holderName);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var publicCertificateNo = reader.GetString(0);

        return new CertificatePublicDto(
            publicCertificateNo,
            reader.GetString(1),
            GetNullableString(reader, 2, "道士资格认证"),
            GetNullableString(reader, 3),
            FormatCertificationLevel(GetNullableString(reader, 4), GetNullableString(reader, 2, "道士资格认证")),
            "ITCA / 国际道教与文化协会",
            GetDateString(reader, 5),
            GetDateString(reader, 6),
            GetDateString(reader, 7),
            reader.GetString(8),
            $"/certificates/{Uri.EscapeDataString(publicCertificateNo)}"
        );
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        return reader.IsDBNull(ordinal) ? fallback : reader.GetString(ordinal);
    }

    private static string GetDateString(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return string.Empty;
        }

        return reader.GetFieldValue<DateOnly>(ordinal).ToString("yyyy-MM-dd");
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
