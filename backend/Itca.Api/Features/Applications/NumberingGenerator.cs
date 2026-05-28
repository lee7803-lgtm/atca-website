using Npgsql;

namespace Itca.Api.Features.Applications;

public static class NumberingGenerator
{
    public static async Task<string> GenerateAsync(
        NpgsqlConnection connection,
        string sequenceKey,
        string prefix,
        int year,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "select public.generate_itca_number(@sequenceKey, @prefix, @year);";
        command.Parameters.AddWithValue("sequenceKey", sequenceKey);
        command.Parameters.AddWithValue("prefix", prefix);
        command.Parameters.AddWithValue("year", year);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToString(result)?.Trim() ?? string.Empty;
    }

    public static string GetApplicationSequenceKey(string applicationType, int year)
    {
        return applicationType == "organization_member"
            ? $"application_member_organization_{year}"
            : $"application_member_personal_{year}";
    }

    public static string GetApplicationPrefix(string applicationType)
    {
        return applicationType == "organization_member" ? "ARID-ITCA-ORG" : "ARID-ITCA-M";
    }

    public static string GetMemberSequenceKey(string applicationType, int year)
    {
        return applicationType == "organization_member"
            ? $"member_organization_{year}"
            : $"member_personal_{year}";
    }

    public static string GetMemberPrefix(string applicationType)
    {
        return applicationType == "organization_member" ? "ITCA-ORG" : "ITCA-M";
    }
}
