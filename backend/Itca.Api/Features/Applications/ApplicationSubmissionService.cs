using Itca.Api.Data;
using Npgsql;
using NpgsqlTypes;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationSubmissionService(SupabaseDb database)
{
    private static readonly string[] OpenStatuses =
    [
        "submitted",
        "pending_review",
        "under_review",
        "need_more_info",
        "approved"
    ];

    private static readonly HashSet<string> ValidOrganizationTypes =
    [
        "宫观道堂及文化场所",
        "传统文化机构",
        "教育研究机构",
        "社团组织",
        "合作单位",
        "宫观",
        "文化机构",
        "培训机构",
        "企业",
        "其他"
    ];

    public async Task<ApplicationSubmissionResult> SubmitMemberApplicationAsync(
        ApplicationSubmissionRequest? request,
        CancellationToken cancellationToken
    )
    {
        return await SubmitApplicationAsync("personal_member", request, cancellationToken);
    }

    public async Task<ApplicationSubmissionResult> SubmitOrganizationApplicationAsync(
        ApplicationSubmissionRequest? request,
        CancellationToken cancellationToken
    )
    {
        return await SubmitApplicationAsync("organization_member", request, cancellationToken);
    }

    private async Task<ApplicationSubmissionResult> SubmitApplicationAsync(
        string expectedApplicationType,
        ApplicationSubmissionRequest? request,
        CancellationToken cancellationToken
    )
    {
        var values = ValidateRequest(expectedApplicationType, request);

        await using var connection = await database.OpenConnectionAsync(cancellationToken);

        if (await HasOpenApplicationAsync(connection, values.ApplicationType, values.Email, values.Phone, cancellationToken))
        {
            throw new OpenApplicationAlreadyExistsException();
        }

        var now = DateTimeOffset.UtcNow;
        var applicationNo = await NumberingGenerator.GenerateUniquePublicNumberAsync(
            connection,
            NumberingGenerator.GetApplicationPrefix(values.ApplicationType),
            now.Year,
            NumberingGenerator.PublicNumberTarget.ApplicationNo,
            cancellationToken
        );

        await InsertApplicationAsync(connection, applicationNo, values, now, cancellationToken);

        return new ApplicationSubmissionResult(applicationNo, values.ApplicationType, "submitted");
    }

    private static ValidatedApplicationSubmission ValidateRequest(
        string expectedApplicationType,
        ApplicationSubmissionRequest? request
    )
    {
        var fieldErrors = new Dictionary<string, string>();

        if (request is null)
        {
            throw new ApplicationValidationException(
                "申请资料未通过基础校验，请补充或修正后重新提交。",
                new Dictionary<string, string> { ["request"] = "申请资料格式不正确。" }
            );
        }

        var applicationType = Trim(request.ApplicationType);
        var name = Trim(request.Name);
        var contactName = Trim(request.ContactName);
        var phone = Trim(request.Phone);
        var email = Trim(request.Email);
        var country = Trim(request.Country);
        var profile = Trim(request.Profile);
        var purpose = Trim(request.Purpose);
        var organizationType = Trim(request.OrganizationType);
        var honeypot = Trim(request.CompanyWebsite) + Trim(request.WebsiteUrl);

        if (!string.IsNullOrWhiteSpace(honeypot))
        {
            fieldErrors["request"] = "申请资料未通过基础校验，请稍后重试。";
        }

        if (applicationType != expectedApplicationType)
        {
            fieldErrors["applicationType"] = "申请类型不正确。";
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            fieldErrors["name"] = expectedApplicationType == "organization_member" ? "请填写机构名称。" : "请填写姓名。";
        }
        else if (!IsValidLength(name, 2, expectedApplicationType == "organization_member" ? 80 : 50))
        {
            fieldErrors["name"] = expectedApplicationType == "organization_member" ? "机构名称长度需为 2–80 个字符。" : "姓名长度需为 2–50 个字符。";
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            fieldErrors["phone"] = "请填写手机或 WhatsApp。";
        }
        else if (!IsValidPhone(phone))
        {
            fieldErrors["phone"] = "请填写有效联系电话。";
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            fieldErrors["email"] = "请填写邮箱。";
        }
        else if (!IsEmail(email))
        {
            fieldErrors["email"] = "请输入有效邮箱地址。";
        }

        if (string.IsNullOrWhiteSpace(country))
        {
            fieldErrors["country"] = "请选择所在国家或地区。";
        }

        if (!request.TruthConfirmed)
        {
            fieldErrors["truthConfirmed"] = "请确认所提交资料真实有效。";
        }

        if (!request.TermsAccepted)
        {
            fieldErrors["termsAccepted"] = "请确认服务条款后再提交。";
        }

        if (!request.PrivacyAccepted)
        {
            fieldErrors["privacyAccepted"] = "请确认隐私政策后再提交。";
        }

        if (expectedApplicationType == "personal_member")
        {
            contactName = name;
            organizationType = string.Empty;

            if (string.IsNullOrWhiteSpace(purpose))
            {
                fieldErrors["purpose"] = "请填写会员申请说明。";
            }
            else if (!IsValidLength(purpose, 20, 1500))
            {
                fieldErrors["purpose"] = "请填写会员申请说明，且不少于 20 字、不超过 1500 字。";
            }

            if (profile.Length > 1000)
            {
                fieldErrors["profile"] = "补充备注不能超过 1000 字。";
            }
        }

        if (expectedApplicationType == "organization_member")
        {
            if (string.IsNullOrWhiteSpace(contactName))
            {
                fieldErrors["contactName"] = "请填写负责人姓名。";
            }
            else if (!IsValidLength(contactName, 2, 50))
            {
                fieldErrors["contactName"] = "联系人姓名长度需为 2–50 个字符。";
            }

            if (string.IsNullOrWhiteSpace(organizationType) || !ValidOrganizationTypes.Contains(organizationType))
            {
                fieldErrors["organizationType"] = "请选择机构类型。";
            }

            if (string.IsNullOrWhiteSpace(profile))
            {
                fieldErrors["profile"] = "请填写机构介绍。";
            }
            else if (!IsValidLength(profile, 30, 2000))
            {
                fieldErrors["profile"] = "请填写机构介绍，且不少于 30 字、不超过 2000 字。";
            }

            if (purpose.Length > 1500)
            {
                fieldErrors["purpose"] = "合作意向说明不能超过 1500 字。";
            }
        }

        if (fieldErrors.Count > 0)
        {
            throw new ApplicationValidationException(
                "申请资料未通过基础校验，请补充或修正后重新提交。",
                fieldErrors
            );
        }

        return new ValidatedApplicationSubmission(
            expectedApplicationType,
            name,
            contactName,
            phone,
            email,
            country,
            profile,
            purpose,
            string.IsNullOrWhiteSpace(organizationType) ? null : organizationType,
            request.ReceiveNotice,
            request.TruthConfirmed,
            request.TermsAccepted,
            request.PrivacyAccepted
        );
    }

    private static async Task<bool> HasOpenApplicationAsync(
        NpgsqlConnection connection,
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
            where application_type = @applicationType
              and status = any(@openStatuses)
              and (email = @email or phone = @phone)
            limit 1;
            """;
        command.Parameters.AddWithValue("applicationType", applicationType);
        command.Parameters.AddWithValue("openStatuses", OpenStatuses);
        command.Parameters.AddWithValue("email", email);
        command.Parameters.AddWithValue("phone", phone);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is not null;
    }

    private static async Task InsertApplicationAsync(
        NpgsqlConnection connection,
        string applicationNo,
        ValidatedApplicationSubmission values,
        DateTimeOffset now,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into applications (
              application_no,
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
            ) values (
              @applicationNo,
              'arid',
              @applicationType,
              'submitted',
              @name,
              @contactName,
              @phone,
              @email,
              @country,
              @organizationType,
              @profile,
              @purpose,
              @receiveNotice,
              @truthConfirmed,
              @termsAccepted,
              @privacyAccepted,
              @confirmedAt,
              '',
              @supplementalSubmissions,
              null,
              @createdAt,
              @updatedAt
            );
            """;
        command.Parameters.AddWithValue("applicationNo", applicationNo);
        command.Parameters.AddWithValue("applicationType", values.ApplicationType);
        command.Parameters.AddWithValue("name", values.Name);
        command.Parameters.AddWithValue("contactName", values.ContactName);
        command.Parameters.AddWithValue("phone", values.Phone);
        command.Parameters.AddWithValue("email", values.Email);
        command.Parameters.AddWithValue("country", values.Country);
        command.Parameters.AddWithValue("organizationType", (object?)values.OrganizationType ?? DBNull.Value);
        command.Parameters.AddWithValue("profile", values.Profile);
        command.Parameters.AddWithValue("purpose", values.Purpose);
        command.Parameters.AddWithValue("receiveNotice", values.ReceiveNotice);
        command.Parameters.AddWithValue("truthConfirmed", values.TruthConfirmed);
        command.Parameters.AddWithValue("termsAccepted", values.TermsAccepted);
        command.Parameters.AddWithValue("privacyAccepted", values.PrivacyAccepted);
        command.Parameters.AddWithValue("confirmedAt", now);
        command.Parameters.AddWithValue("supplementalSubmissions", NpgsqlDbType.Jsonb, "[]");
        command.Parameters.AddWithValue("createdAt", now);
        command.Parameters.AddWithValue("updatedAt", now);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string Trim(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }

    private static bool IsValidLength(string value, int min, int max)
    {
        return value.Length >= min && value.Length <= max;
    }

    private static bool IsEmail(string value)
    {
        var at = value.IndexOf('@');
        var dot = value.LastIndexOf('.');
        return at > 0 && dot > at + 1 && dot < value.Length - 1 && !value.Any(char.IsWhiteSpace);
    }

    private static bool IsValidPhone(string value)
    {
        if (value.Length < 6 || value.Length > 30)
        {
            return false;
        }

        if (!(value[0] == '+' || char.IsDigit(value[0])))
        {
            return false;
        }

        return value.All(character => char.IsDigit(character) || character is ' ' or '(' or ')' or '.' or '-');
    }

    private sealed record ValidatedApplicationSubmission(
        string ApplicationType,
        string Name,
        string ContactName,
        string Phone,
        string Email,
        string Country,
        string Profile,
        string Purpose,
        string? OrganizationType,
        bool ReceiveNotice,
        bool TruthConfirmed,
        bool TermsAccepted,
        bool PrivacyAccepted
    );
}
