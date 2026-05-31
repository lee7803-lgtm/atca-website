using System.Text.Json;
using Itca.Api.Data;
using Npgsql;
using NpgsqlTypes;

namespace Itca.Api.Features.Payments;

public sealed class PaymentNotificationLogWriter(SupabaseDb database, ILogger<PaymentNotificationLogWriter> logger)
{
    public async Task WriteStatusNotificationAsync(
        PaymentOrderAuditSnapshot order,
        string notificationType,
        string sourceAction,
        string actor,
        CancellationToken cancellationToken
    )
    {
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
                  certification_application_id,
                  certificate_id,
                  application_no,
                  member_no,
                  certificate_no,
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
                  created_by,
                  skipped_at
                )
                values (
                  @notificationType,
                  'system',
                  'skipped',
                  @idempotencyKey,
                  @applicationId,
                  @certificationApplicationId,
                  @certificateId,
                  @applicationNo,
                  @memberNo,
                  @certificateNo,
                  'payment_order',
                  @sourceAction,
                  @recipientName,
                  @recipientEmail,
                  @recipientPhone,
                  @subject,
                  @messageBody,
                  @templateKey,
                  @payloadJson,
                  'none',
                  '{}'::jsonb,
                  @createdBy,
                  now()
                )
                on conflict (idempotency_key) where idempotency_key is not null do nothing;
                """;

            command.Parameters.AddWithValue("notificationType", notificationType);
            command.Parameters.AddWithValue("idempotencyKey", $"payment:{order.OrderNo}:{sourceAction}");
            AddNullableUuidParameter(command, "applicationId", order.ApplicationId);
            AddNullableUuidParameter(command, "certificationApplicationId", order.CertificationApplicationId);
            AddNullableUuidParameter(command, "certificateId", order.CertificateId);
            AddNullableTextParameter(command, "applicationNo", order.ApplicationNo);
            AddNullableTextParameter(command, "memberNo", order.MemberNo);
            AddNullableTextParameter(command, "certificateNo", order.CertificateNo);
            command.Parameters.AddWithValue("sourceAction", sourceAction);
            AddNullableTextParameter(command, "recipientName", order.PayerName);
            AddNullableTextParameter(command, "recipientEmail", order.PayerEmail);
            AddNullableTextParameter(command, "recipientPhone", order.PayerPhone);
            command.Parameters.AddWithValue("subject", $"支付订单 {order.OrderNo} 状态更新");
            command.Parameters.AddWithValue("messageBody", $"支付订单 {order.OrderNo} 已更新为 {order.Status}。");
            command.Parameters.AddWithValue("templateKey", notificationType);
            AddJsonbParameter(command, "payloadJson", new
            {
                order.OrderNo,
                order.BusinessType,
                order.ApplicationNo,
                order.MemberNo,
                order.CertificateNo,
                order.Amount,
                order.Currency,
                order.Provider,
                order.PaymentChannel,
                order.Status,
                Actor = actor
            });
            command.Parameters.AddWithValue("createdBy", string.IsNullOrWhiteSpace(actor) ? "system" : actor);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception error)
        {
            logger.LogWarning(
                error,
                "Payment notification log write failed. OrderNo={OrderNo}; NotificationType={NotificationType}",
                order.OrderNo,
                notificationType
            );
        }
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
