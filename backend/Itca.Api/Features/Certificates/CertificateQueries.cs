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
              taoist_name,
              taoist_rank,
              sect,
              certification_path,
              certification_level,
              lineage_or_temple,
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
            GetNullableString(reader, 2),
            GetNullableString(reader, 3),
            GetNullableString(reader, 4),
            GetNullableString(reader, 5),
            GetNullableString(reader, 6),
            GetNullableString(reader, 7),
            GetDateString(reader, 8),
            GetDateString(reader, 9),
            GetDateString(reader, 10),
            reader.GetString(11),
            $"/certificates/{Uri.EscapeDataString(publicCertificateNo)}"
        );
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    private static string GetDateString(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return string.Empty;
        }

        return reader.GetFieldValue<DateOnly>(ordinal).ToString("yyyy-MM-dd");
    }
}
