using System.Text.Json;
using Itca.Api.Data;
using Npgsql;
using NpgsqlTypes;

namespace Itca.Api.Features.Applications;

public sealed class ApplicationNotificationLogWriter(SupabaseDb database, ILogger<ApplicationNotificationLogWriter> logger)
{
    public async Task WriteSubmittedNotificationAsync(
        Guid? applicationId,
        string applicationNo,
        string applicationType,
        string applicantName,
        string contactName,
        string recipientEmail,
        string recipientPhone,
        CancellationToken cancellationToken
    )
    {
        var notificationType = applicationType == "organization_member"
            ? "organization_application_submitted"
            : "member_application_submitted";

        try
        {
            await using var connection = await database.OpenConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();

            command.CommandText = """
                insert into notification_logs (
                  notification_type,
                  channel,
                  send_status,
                  idempotency_key,
                  application_id,
                  application_no,
                  source_type,
                  source_action,
                  recipient_name,
                  recipient_email,
                  recipient_phone,
                  subject,
                  message_body,
                  template_key,
                  payload_json,
                  provider,
                  provider_response,
                  created_by
                )
                values (
                  @notificationType,
                  'email',
                  'pending',
                  @idempotencyKey,
                  @applicationId,
                  @applicationNo,
                  'application',
                  'submitted',
                  @recipientName,
                  @recipientEmail,
                  @recipientPhone,
                  @subject,
                  @messageBody,
                  @templateKey,
                  @payloadJson,
                  'none',
                  '{}'::jsonb,
                  'system'
                )
                on conflict (idempotency_key) where idempotency_key is not null do nothing;
                """;

            command.Parameters.AddWithValue("notificationType", notificationType);
            command.Parameters.AddWithValue("idempotencyKey", $"{notificationType}:email:{applicationNo}:submitted");
            AddNullableUuidParameter(command, "applicationId", applicationId);
            command.Parameters.AddWithValue("applicationNo", applicationNo);
            AddNullableTextParameter(command, "recipientName", ResolveRecipientName(applicationType, applicantName, contactName));
            AddNullableTextParameter(command, "recipientEmail", recipientEmail);
            AddNullableTextParameter(command, "recipientPhone", recipientPhone);
            command.Parameters.AddWithValue("subject", GetSubject(applicationType));
            command.Parameters.AddWithValue("messageBody", GetMessageBody(applicationType, applicationNo));
            command.Parameters.AddWithValue("templateKey", $"email.{notificationType}");
            AddJsonbParameter(command, "payloadJson", new
            {
                NotificationType = notificationType,
                ApplicationNo = applicationNo,
                ApplicationKind = applicationType == "organization_member" ? "organization" : "member"
            });

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception error)
        {
            logger.LogWarning(
                error,
                "Application submission notification log write failed. ApplicationNo={ApplicationNo}; NotificationType={NotificationType}",
                applicationNo,
                notificationType
            );
        }
    }

    private static string ResolveRecipientName(string applicationType, string applicantName, string contactName)
    {
        return applicationType == "organization_member" && !string.IsNullOrWhiteSpace(contactName)
            ? contactName
            : applicantName;
    }

    private static string GetSubject(string applicationType)
    {
        return applicationType == "organization_member"
            ? "ITCA 机构会员申请已提交"
            : "ITCA 会员申请已提交";
    }

    private static string GetMessageBody(string applicationType, string applicationNo)
    {
        var applicationName = applicationType == "organization_member" ? "ITCA 机构会员申请" : "ITCA 会员申请";
        return $"""
            您好：

            您的 {applicationName} 已提交。我们将按流程进行审核，并在状态更新后通知您。

            申请编号：{applicationNo}

            后续说明：您可通过官网申请进度查询入口查看最新进度。

            此邮件为 ITCA 官网系统通知。请勿回复本邮件；如需协助，请通过官网公布的联系方式联系。
            """;
    }

    private static void AddNullableTextParameter(NpgsqlCommand command, string name, string? value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Text);
        parameter.Value = string.IsNullOrWhiteSpace(value) ? DBNull.Value : value;
    }

    private static void AddNullableUuidParameter(NpgsqlCommand command, string name, Guid? value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Uuid);
        parameter.Value = value.HasValue ? value.Value : DBNull.Value;
    }

    private static void AddJsonbParameter(NpgsqlCommand command, string name, object value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Jsonb);
        parameter.Value = JsonSerializer.Serialize(value);
    }
}
