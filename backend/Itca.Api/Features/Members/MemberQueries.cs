using Itca.Api.Data;
using Itca.Api.Features.Validity;
using Npgsql;

namespace Itca.Api.Features.Members;

public sealed class MemberQueries(SupabaseDb database)
{
    public async Task<MemberPublicDto?> FindPublicMemberAsync(
        string memberNo,
        string holderName,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        command.CommandText = """
            select
              member_no,
              name,
              application_type,
              status,
              created_at,
              updated_at,
              member_no_issued_at,
              member_valid_from,
              member_valid_until,
              member_status,
              member_renewal_status
            from applications
            where member_no = @memberNo
              and name = @holderName
              and application_type in ('personal_member', 'organization_member')
            limit 1;
            """;
        command.Parameters.AddWithValue("memberNo", memberNo);
        command.Parameters.AddWithValue("holderName", holderName);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadPublicMember(reader);
    }

    private static MemberPublicDto ReadPublicMember(NpgsqlDataReader reader)
    {
        var status = reader.GetString(3);
        var memberValidFrom = GetDateStringOrNull(reader, 7);
        var memberValidUntil = GetDateStringOrNull(reader, 8);
        var memberStatus = GetNullableString(reader, 9, "active");
        var memberRenewalStatus = GetNullableString(reader, 10, "none");
        var effective = ValidityCalculator.ForMember(
            memberStatus,
            memberRenewalStatus,
            GetDateOnlyOrNull(reader, 8),
            DateOnly.FromDateTime(DateTime.UtcNow)
        );
        var approvedAt = status == "approved" || status == "archived" ? GetTimestampString(reader, 6, GetTimestampString(reader, 5)) : string.Empty;

        return new MemberPublicDto(
            reader.GetString(0),
            reader.GetString(1),
            FormatMemberType(reader.GetString(2)),
            status,
            effective.EffectiveStatusLabel,
            memberValidFrom,
            memberValidUntil,
            effective.EffectiveStatus,
            effective.EffectiveStatusLabel,
            effective.DaysUntilExpiry,
            effective.ExpiryBucket,
            GetTimestampString(reader, 4),
            approvedAt,
            "ITCA / 国际道教与文化协会",
            "本页面用于核验会员登记公开信息。公开核验结果仅展示会员编号、姓名或机构名称、会员类型、会员状态及登记信息。"
        );
    }

    private static string FormatMemberType(string applicationType)
    {
        return applicationType switch
        {
            "personal_member" => "个人会员",
            "organization_member" => "机构会员",
            _ => "会员"
        };
    }

    private static string FormatStatusLabel(string status)
    {
        return status switch
        {
            "submitted" => "已提交",
            "pending_review" => "待审核",
            "under_review" => "审核中",
            "need_more_info" => "需补充资料",
            "approved" => "有效",
            "rejected" => "已驳回",
            "archived" => "有效",
            _ => "状态待确认"
        };
    }

    private static string GetTimestampString(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        if (reader.IsDBNull(ordinal))
        {
            return fallback;
        }

        return reader.GetFieldValue<DateTime>(ordinal).ToString("O");
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        return reader.IsDBNull(ordinal) ? fallback : reader.GetString(ordinal);
    }

    private static DateOnly? GetDateOnlyOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetFieldValue<DateOnly>(ordinal);
    }

    private static string? GetDateStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return GetDateOnlyOrNull(reader, ordinal)?.ToString("yyyy-MM-dd");
    }
}
