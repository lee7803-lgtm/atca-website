using System.Security.Cryptography;
using Npgsql;

namespace Itca.Api.Features.Applications;

public static class NumberingGenerator
{
    private const string PublicSuffixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int PublicSuffixLength = 6;
    private const int MaxGenerationAttempts = 10;

    public enum PublicNumberTarget
    {
        ApplicationNo,
        MemberNo
    }

    public static async Task<string> GenerateUniquePublicNumberAsync(
        NpgsqlConnection connection,
        string prefix,
        int year,
        PublicNumberTarget target,
        CancellationToken cancellationToken
    )
    {
        var columnName = target == PublicNumberTarget.MemberNo ? "member_no" : "application_no";

        for (var attempt = 0; attempt < MaxGenerationAttempts; attempt += 1)
        {
            var candidate = $"{prefix}-{year}-{GeneratePublicSuffix()}";
            if (!await PublicNumberExistsAsync(connection, columnName, candidate, cancellationToken))
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Unable to generate a unique public ITCA number.");
    }

    private static async Task<bool> PublicNumberExistsAsync(
        NpgsqlConnection connection,
        string columnName,
        string candidate,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"select exists(select 1 from applications where {columnName} = @candidate);";
        command.Parameters.AddWithValue("candidate", candidate);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is bool exists && exists;
    }

    private static string GeneratePublicSuffix()
    {
        Span<char> buffer = stackalloc char[PublicSuffixLength];
        for (var index = 0; index < buffer.Length; index += 1)
        {
            buffer[index] = PublicSuffixAlphabet[RandomNumberGenerator.GetInt32(PublicSuffixAlphabet.Length)];
        }

        return new string(buffer);
    }

    public static string GetApplicationPrefix(string applicationType)
    {
        return applicationType == "organization_member" ? "ARID-ITCA-ORG" : "ARID-ITCA-M";
    }

    public static string GetMemberPrefix(string applicationType)
    {
        return applicationType == "organization_member" ? "ITCA-ORG" : "ITCA-M";
    }
}
