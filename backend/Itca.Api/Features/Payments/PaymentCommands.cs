using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Itca.Api.Data;
using Itca.Api.Features.Admin;
using Npgsql;
using NpgsqlTypes;

namespace Itca.Api.Features.Payments;

public sealed class PaymentCommands(
    SupabaseDb database,
    AuditLogWriter auditLogs,
    PaymentNotificationLogWriter notificationLogs
)
{
    private const string PendingPaymentStatus = "pending_payment";
    private static readonly Regex CurrencyPattern = new("^[A-Z]{3}$", RegexOptions.Compiled);
    private static readonly HashSet<string> ValidCreateProviders = ["none", "manual"];
    private static readonly HashSet<string> ValidCreateSourceTypes = ["application", "certification_application"];
    private static readonly HashSet<string> ValidMemberApplicationBusinessTypes = ["personal_member_application", "organization_member_application", "personal_member_renewal", "organization_member_renewal"];
    private static readonly HashSet<string> ValidCertificationApplicationBusinessTypes = ["taoist_certification_application", "taoist_certification_renewal", "taoist_certification_rereview"];
    private static readonly HashSet<string> ValidTargetStatuses = ["manual_review", "paid", "cancelled"];
    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new()
    {
        ["pending_payment"] = ["manual_review", "paid", "cancelled"],
        ["manual_review"] = ["paid", "cancelled"],
        ["failed"] = ["manual_review", "cancelled"]
    };

    public async Task<PaymentOrderCreateResult> CreateOrderAsync(
        PaymentOrderCreateRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new PaymentValidationException("支付订单创建资料格式不正确。");
        }

        var sourceType = request.SourceType?.Trim() ?? string.Empty;
        if (!ValidCreateSourceTypes.Contains(sourceType))
        {
            throw new PaymentValidationException("请选择有效的支付订单来源。");
        }

        if (!request.SourceId.HasValue || request.SourceId == Guid.Empty)
        {
            throw new PaymentValidationException("支付订单来源记录无效。");
        }

        var amount = request.Amount ?? -1;
        if (amount <= 0)
        {
            throw new PaymentValidationException("请输入大于 0 的金额。");
        }

        var currency = (request.Currency?.Trim() ?? "MYR").ToUpperInvariant();
        if (!CurrencyPattern.IsMatch(currency))
        {
            throw new PaymentValidationException("币种必须使用 3 位大写 ISO 代码。");
        }

        var provider = (request.Provider?.Trim() ?? "manual").ToLowerInvariant();
        if (!ValidCreateProviders.Contains(provider))
        {
            throw new PaymentValidationException("请选择有效的支付方式。");
        }

        var paymentChannel = request.PaymentChannel?.Trim() ?? "manual";
        if (string.IsNullOrWhiteSpace(paymentChannel))
        {
            paymentChannel = provider == "none" ? "none" : "manual";
        }

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var source = sourceType == "application"
            ? await GetMemberApplicationPaymentSourceAsync(connection, request.SourceId.Value, cancellationToken)
            : await GetCertificationApplicationPaymentSourceAsync(connection, request.SourceId.Value, cancellationToken);

        if (source is null)
        {
            throw new PaymentValidationException(sourceType == "application" ? "未找到可生成支付订单的会员申请。" : "未找到可生成支付订单的认证申请。");
        }

        source = source with { BusinessType = ResolveBusinessType(source, sourceType, request.BusinessType?.Trim()) };

        var existingActiveOrder = await FindExistingActiveOrderAsync(connection, source, cancellationToken);
        if (existingActiveOrder is not null)
        {
            return new PaymentOrderCreateResult(
                existingActiveOrder,
                false,
                existingActiveOrder.Status == "paid" ? "该业务记录已有已付款订单，不能重复生成。" : "该业务记录已有有效支付订单。"
            );
        }

        var actorLabel = GetActorLabel(actor);
        var orderNo = await GenerateOrderNoAsync(connection, cancellationToken);
        var orderId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        await using var insertCommand = connection.CreateCommand();
        insertCommand.CommandText = """
            insert into payment_orders (
              id,
              order_no,
              business_type,
              business_id,
              application_id,
              certification_application_id,
              application_no,
              member_no,
              payer_name,
              payer_email,
              payer_phone,
              amount,
              currency,
              fee_code,
              payment_channel,
              provider,
              status,
              admin_note,
              metadata,
              created_by,
              created_at,
              updated_at
            )
            values (
              @id,
              @orderNo,
              @businessType,
              @businessId,
              @applicationId,
              @certificationApplicationId,
              @applicationNo,
              @memberNo,
              @payerName,
              @payerEmail,
              @payerPhone,
              @amount,
              @currency,
              'application_fee',
              @paymentChannel,
              @provider,
              @status,
              @adminNote,
              @metadata,
              @createdBy,
              @now,
              @now
            )
            returning id;
            """;
        insertCommand.Parameters.AddWithValue("id", orderId);
        insertCommand.Parameters.AddWithValue("orderNo", orderNo);
        insertCommand.Parameters.AddWithValue("businessType", source.BusinessType);
        insertCommand.Parameters.AddWithValue("businessId", source.SourceId);
        AddNullableUuidParameter(insertCommand, "applicationId", source.ApplicationId);
        AddNullableUuidParameter(insertCommand, "certificationApplicationId", source.CertificationApplicationId);
        AddNullableTextParameter(insertCommand, "applicationNo", source.ApplicationNo);
        AddNullableTextParameter(insertCommand, "memberNo", source.MemberNo);
        AddNullableTextParameter(insertCommand, "payerName", source.PayerName);
        AddNullableTextParameter(insertCommand, "payerEmail", source.PayerEmail);
        AddNullableTextParameter(insertCommand, "payerPhone", source.PayerPhone);
        insertCommand.Parameters.AddWithValue("amount", amount);
        insertCommand.Parameters.AddWithValue("currency", currency);
        insertCommand.Parameters.AddWithValue("paymentChannel", paymentChannel);
        insertCommand.Parameters.AddWithValue("provider", provider);
        insertCommand.Parameters.AddWithValue("status", PendingPaymentStatus);
        AddNullableTextParameter(insertCommand, "adminNote", request.AdminNote?.Trim());
        AddJsonbParameter(insertCommand, "metadata", new
        {
            sourceType,
            source.SourceId,
            source.ApplicationNo,
            createdFrom = "admin_application_detail"
        });
        insertCommand.Parameters.AddWithValue("createdBy", actorLabel);
        insertCommand.Parameters.AddWithValue("now", now);

        await insertCommand.ExecuteScalarAsync(cancellationToken);

        var createdOrder = await PaymentQueries.GetPaymentOrderAsync(connection, orderId, cancellationToken);
        if (createdOrder is null)
        {
            throw new PaymentValidationException("支付订单创建后未能读取。");
        }

        await InsertPaymentEventAsync(
            connection,
            createdOrder,
            "order_created",
            null,
            PendingPaymentStatus,
            request.AdminNote?.Trim(),
            actorLabel,
            cancellationToken
        );

        var snapshot = PaymentOrderAuditSnapshot.From(createdOrder);
        await auditLogs.WriteAsync(
            new AuditLogEntry(
                actor.AdminId,
                actor.Email,
                actor.Name,
                actor.Role,
                string.IsNullOrWhiteSpace(actor.ActorType) ? "legacy_admin" : actor.ActorType,
                "payment_order.create",
                "payment_order",
                createdOrder.Id.ToString(),
                createdOrder.OrderNo,
                null,
                snapshot,
                $"从申请记录生成支付订单 {createdOrder.OrderNo}。",
                actor.IpAddress,
                actor.UserAgent
            ),
            cancellationToken
        );

        await notificationLogs.WriteStatusNotificationAsync(
            snapshot,
            "payment.order_created",
            "order_created",
            actorLabel,
            cancellationToken
        );

        return new PaymentOrderCreateResult(createdOrder, true, "支付订单已生成。");
    }

    private static string ResolveBusinessType(MemberPaymentSource source, string sourceType, string? requestedBusinessType)
    {
        if (string.IsNullOrWhiteSpace(requestedBusinessType))
        {
            return source.BusinessType;
        }

        if (sourceType == "application")
        {
            if (!ValidMemberApplicationBusinessTypes.Contains(requestedBusinessType))
            {
                throw new PaymentValidationException("该会员申请不支持所选支付业务类型。");
            }

            if (source.DefaultBusinessType == "personal_member_application" && requestedBusinessType.StartsWith("organization_", StringComparison.Ordinal))
            {
                throw new PaymentValidationException("个人会员申请不能生成机构会员支付订单。");
            }

            if (source.DefaultBusinessType == "organization_member_application" && requestedBusinessType.StartsWith("personal_", StringComparison.Ordinal))
            {
                throw new PaymentValidationException("机构会员申请不能生成个人会员支付订单。");
            }

            return requestedBusinessType;
        }

        if (!ValidCertificationApplicationBusinessTypes.Contains(requestedBusinessType))
        {
            throw new PaymentValidationException("该认证申请不支持所选支付业务类型。");
        }

        return requestedBusinessType;
    }

    public async Task<PaymentStatusUpdateResult?> UpdateStatusAsync(
        Guid id,
        PaymentStatusUpdateRequest? request,
        AdminActorContext actor,
        CancellationToken cancellationToken
    )
    {
        if (request is null)
        {
            throw new PaymentValidationException("支付订单更新资料格式不正确。");
        }

        var targetStatus = request.Status?.Trim() ?? string.Empty;
        if (!ValidTargetStatuses.Contains(targetStatus))
        {
            throw new PaymentValidationException("请选择有效的支付订单操作。");
        }

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var beforeOrder = await PaymentQueries.GetPaymentOrderAsync(connection, id, cancellationToken);
        if (beforeOrder is null)
        {
            return null;
        }

        if (beforeOrder.Status == targetStatus)
        {
            throw new PaymentValidationException(targetStatus == "paid" ? "该支付订单已标记为已付款。" : "支付订单已处于目标状态。");
        }

        if (!AllowedTransitions.TryGetValue(beforeOrder.Status, out var allowedTargets) || !allowedTargets.Contains(targetStatus))
        {
            throw new PaymentValidationException(GetTransitionError(beforeOrder.Status, targetStatus));
        }

        var now = DateTimeOffset.UtcNow;
        await using var updateCommand = connection.CreateCommand();
        updateCommand.CommandText = """
            update payment_orders
            set
              status = @status,
              admin_note = @adminNote,
              manual_review_at = case when @status = 'manual_review' then @now else manual_review_at end,
              paid_at = case when @status = 'paid' then @now else paid_at end,
              confirmed_at = case when @status = 'paid' then @now else confirmed_at end,
              confirmed_by = case when @status = 'paid' then @actor else confirmed_by end,
              cancelled_at = case when @status = 'cancelled' then @now else cancelled_at end,
              cancelled_by = case when @status = 'cancelled' then @actor else cancelled_by end,
              updated_at = @now
            where id = @id
            returning id;
            """;
        updateCommand.Parameters.AddWithValue("id", id);
        updateCommand.Parameters.AddWithValue("status", targetStatus);
        AddNullableTextParameter(updateCommand, "adminNote", request.AdminNote?.Trim());
        updateCommand.Parameters.AddWithValue("now", now);
        updateCommand.Parameters.AddWithValue("actor", GetActorLabel(actor));

        var updatedId = await updateCommand.ExecuteScalarAsync(cancellationToken);
        if (updatedId is null)
        {
            return null;
        }

        var eventType = targetStatus switch
        {
            "manual_review" => "manual_review",
            "paid" => "manual_confirmed",
            "cancelled" => "cancelled",
            _ => "admin_note"
        };

        await InsertPaymentEventAsync(
            connection,
            beforeOrder,
            eventType,
            beforeOrder.Status,
            targetStatus,
            request.AdminNote?.Trim(),
            GetActorLabel(actor),
            cancellationToken
        );

        var updatedOrder = await PaymentQueries.GetPaymentOrderAsync(connection, id, cancellationToken);
        if (updatedOrder is null)
        {
            return null;
        }

        var beforeSnapshot = PaymentOrderAuditSnapshot.From(beforeOrder);
        var afterSnapshot = PaymentOrderAuditSnapshot.From(updatedOrder);
        var auditAction = targetStatus switch
        {
            "manual_review" => "payment_order.mark_manual_review",
            "paid" => "payment_order.mark_paid",
            "cancelled" => "payment_order.cancel",
            _ => "payment_order.update"
        };

        await auditLogs.WriteAsync(
            new AuditLogEntry(
                actor.AdminId,
                actor.Email,
                actor.Name,
                actor.Role,
                string.IsNullOrWhiteSpace(actor.ActorType) ? "legacy_admin" : actor.ActorType,
                auditAction,
                "payment_order",
                updatedOrder.Id.ToString(),
                updatedOrder.OrderNo,
                beforeSnapshot,
                afterSnapshot,
                $"支付订单 {updatedOrder.OrderNo} 状态更新为 {updatedOrder.Status}。",
                actor.IpAddress,
                actor.UserAgent
            ),
            cancellationToken
        );

        await notificationLogs.WriteStatusNotificationAsync(
            afterSnapshot,
            GetNotificationType(targetStatus),
            GetNotificationSourceAction(targetStatus),
            GetActorLabel(actor),
            cancellationToken
        );

        return new PaymentStatusUpdateResult(updatedOrder);
    }

    private static async Task InsertPaymentEventAsync(
        NpgsqlConnection connection,
        PaymentOrderDetailDto order,
        string eventType,
        string? fromStatus,
        string? toStatus,
        string? adminNote,
        string actor,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into payment_events (
              payment_order_id,
              order_no,
              event_type,
              from_status,
              to_status,
              provider,
              provider_order_id,
              provider_transaction_id,
              idempotency_key,
              message,
              admin_note,
              payload_json,
              created_by
            )
            values (
              @paymentOrderId,
              @orderNo,
              @eventType,
              @fromStatus,
              @toStatus,
              @provider,
              @providerOrderId,
              @providerTransactionId,
              @idempotencyKey,
              @message,
              @adminNote,
              jsonb_build_object(
                'orderNo', @orderNo,
                'businessType', @businessType,
                'fromStatus', @fromStatus,
                'toStatus', @toStatus,
                'provider', @provider,
                'actor', @actor
              ),
              @actor
            )
            on conflict (idempotency_key) where idempotency_key is not null do nothing;
            """;
        command.Parameters.AddWithValue("paymentOrderId", order.Id);
        command.Parameters.AddWithValue("orderNo", order.OrderNo);
        command.Parameters.AddWithValue("eventType", eventType);
        AddNullableTextParameter(command, "fromStatus", fromStatus);
        AddNullableTextParameter(command, "toStatus", toStatus);
        command.Parameters.AddWithValue("provider", order.Provider);
        AddNullableTextParameter(command, "providerOrderId", order.ProviderOrderId);
        AddNullableTextParameter(command, "providerTransactionId", order.ProviderTransactionId);
        command.Parameters.AddWithValue("idempotencyKey", $"payment-event:{order.OrderNo}:{eventType}:{toStatus}:{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}");
        command.Parameters.AddWithValue("message", fromStatus is null ? $"支付订单 {order.OrderNo} 已创建。" : $"支付订单 {order.OrderNo} 从 {fromStatus} 更新为 {toStatus}。");
        AddNullableTextParameter(command, "adminNote", adminNote);
        command.Parameters.AddWithValue("businessType", order.BusinessType);
        command.Parameters.AddWithValue("actor", actor);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<MemberPaymentSource?> GetMemberApplicationPaymentSourceAsync(
        NpgsqlConnection connection,
        Guid applicationId,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              id,
              application_no,
              member_no,
              application_type,
              name,
              contact_name,
              phone,
              email
            from applications
            where id = @id
              and application_type in ('personal_member', 'organization_member')
            limit 1;
            """;
        command.Parameters.AddWithValue("id", applicationId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var applicationType = reader.GetString(3);
        var payerName = GetNullableString(reader, 5);
        if (string.IsNullOrWhiteSpace(payerName)) payerName = GetNullableString(reader, 4);

        return new MemberPaymentSource(
            reader.GetGuid(0),
            applicationType == "organization_member" ? "organization_member_application" : "personal_member_application",
            reader.GetGuid(0),
            null,
            GetNullableString(reader, 1),
            GetNullableString(reader, 2),
            payerName,
            GetNullableString(reader, 7),
            GetNullableString(reader, 6)
        );
    }

    private static async Task<MemberPaymentSource?> GetCertificationApplicationPaymentSourceAsync(
        NpgsqlConnection connection,
        Guid applicationId,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              id,
              application_no,
              applicant_name,
              phone,
              email
            from certification_applications
            where id = @id
            limit 1;
            """;
        command.Parameters.AddWithValue("id", applicationId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new MemberPaymentSource(
            reader.GetGuid(0),
            "taoist_certification_application",
            null,
            reader.GetGuid(0),
            GetNullableString(reader, 1),
            string.Empty,
            GetNullableString(reader, 2),
            GetNullableString(reader, 4),
            GetNullableString(reader, 3)
        );
    }

    private static async Task<PaymentOrderDetailDto?> FindExistingActiveOrderAsync(
        NpgsqlConnection connection,
        MemberPaymentSource source,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id
            from payment_orders
            where business_type = @businessType
              and status in ('pending_payment', 'manual_review', 'paid')
              and (
                business_id = @sourceId
                or application_id = @applicationId
                or certification_application_id = @certificationApplicationId
                or application_no = @applicationNo
              )
            order by case when status = 'paid' then 0 else 1 end, created_at desc
            limit 1;
            """;
        command.Parameters.AddWithValue("businessType", source.BusinessType);
        command.Parameters.AddWithValue("sourceId", source.SourceId);
        AddNullableUuidParameter(command, "applicationId", source.ApplicationId);
        AddNullableUuidParameter(command, "certificationApplicationId", source.CertificationApplicationId);
        AddNullableTextParameter(command, "applicationNo", source.ApplicationNo);

        var existingId = await command.ExecuteScalarAsync(cancellationToken);
        if (existingId is not Guid id)
        {
            return null;
        }

        return await PaymentQueries.GetPaymentOrderAsync(connection, id, cancellationToken);
    }

    private static async Task<string> GenerateOrderNoAsync(NpgsqlConnection connection, CancellationToken cancellationToken)
    {
        const string alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        var year = DateTimeOffset.UtcNow.Year;

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var suffix = new char[6];
            for (var index = 0; index < suffix.Length; index++)
            {
                suffix[index] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
            }

            var candidate = $"ITCA-PAY-{year}-{new string(suffix)}";
            await using var command = connection.CreateCommand();
            command.CommandText = "select exists(select 1 from payment_orders where order_no = @orderNo);";
            command.Parameters.AddWithValue("orderNo", candidate);
            var exists = await command.ExecuteScalarAsync(cancellationToken);
            if (exists is false)
            {
                return candidate;
            }
        }

        throw new PaymentValidationException("支付订单编号生成失败，请重试。");
    }

    private static string GetTransitionError(string currentStatus, string targetStatus)
    {
        if (currentStatus == "paid" && targetStatus == "paid")
        {
            return "该支付订单已标记为已付款。";
        }

        if (currentStatus == "cancelled")
        {
            return "已取消的支付订单不能在本阶段重新标记为已付款。";
        }

        if (currentStatus == "refunded")
        {
            return "已退款订单本阶段仅展示状态，不支持人工退款或恢复。";
        }

        return $"当前状态 {currentStatus} 不允许更新为 {targetStatus}。";
    }

    private static string GetNotificationType(string status)
    {
        return status switch
        {
            "manual_review" => "payment.manual_confirmed",
            "paid" => "payment.paid",
            "cancelled" => "payment.cancelled",
            _ => "payment.order_updated"
        };
    }

    private static string GetNotificationSourceAction(string status)
    {
        return status switch
        {
            "manual_review" => "manual_review",
            "paid" => "paid",
            "cancelled" => "cancelled",
            _ => "updated"
        };
    }

    private static string GetActorLabel(AdminActorContext actor)
    {
        if (!string.IsNullOrWhiteSpace(actor.Email)) return actor.Email;
        if (!string.IsNullOrWhiteSpace(actor.Name)) return actor.Name;
        return "admin";
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

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }
}

internal sealed record MemberPaymentSource(
    Guid SourceId,
    string BusinessType,
    Guid? ApplicationId,
    Guid? CertificationApplicationId,
    string ApplicationNo,
    string MemberNo,
    string PayerName,
    string PayerEmail,
    string PayerPhone
)
{
    public string DefaultBusinessType { get; } = BusinessType;
};

public sealed class PaymentValidationException(string message) : Exception(message);

public sealed record PaymentOrderAuditSnapshot(
    Guid Id,
    string OrderNo,
    string BusinessType,
    Guid? BusinessId,
    Guid? ApplicationId,
    Guid? CertificationApplicationId,
    Guid? CertificateId,
    string ApplicationNo,
    string MemberNo,
    string CertificateNo,
    string PayerName,
    string PayerEmail,
    string PayerPhone,
    decimal Amount,
    string Currency,
    string Provider,
    string PaymentChannel,
    string Status,
    string? PaidAt,
    string? ManualReviewAt,
    string? CancelledAt,
    string UpdatedAt
)
{
    public static PaymentOrderAuditSnapshot From(PaymentOrderDetailDto order)
    {
        return new PaymentOrderAuditSnapshot(
            order.Id,
            order.OrderNo,
            order.BusinessType,
            order.BusinessId,
            order.ApplicationId,
            order.CertificationApplicationId,
            order.CertificateId,
            order.ApplicationNo,
            order.MemberNo,
            order.CertificateNo,
            order.PayerName,
            order.PayerEmail,
            order.PayerPhone,
            order.Amount,
            order.Currency,
            order.Provider,
            order.PaymentChannel,
            order.Status,
            order.PaidAt,
            order.ManualReviewAt,
            order.CancelledAt,
            order.UpdatedAt
        );
    }
}
