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
    private static readonly HashSet<string> ValidTargetStatuses = ["manual_review", "paid", "cancelled"];
    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new()
    {
        ["pending_payment"] = ["manual_review", "paid", "cancelled"],
        ["manual_review"] = ["paid", "cancelled"],
        ["failed"] = ["manual_review", "cancelled"]
    };

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
        string fromStatus,
        string toStatus,
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
        command.Parameters.AddWithValue("fromStatus", fromStatus);
        command.Parameters.AddWithValue("toStatus", toStatus);
        command.Parameters.AddWithValue("provider", order.Provider);
        AddNullableTextParameter(command, "providerOrderId", order.ProviderOrderId);
        AddNullableTextParameter(command, "providerTransactionId", order.ProviderTransactionId);
        command.Parameters.AddWithValue("idempotencyKey", $"payment-event:{order.OrderNo}:{eventType}:{toStatus}:{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}");
        command.Parameters.AddWithValue("message", $"支付订单 {order.OrderNo} 从 {fromStatus} 更新为 {toStatus}。");
        AddNullableTextParameter(command, "adminNote", adminNote);
        command.Parameters.AddWithValue("businessType", order.BusinessType);
        command.Parameters.AddWithValue("actor", actor);

        await command.ExecuteNonQueryAsync(cancellationToken);
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
}

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
