using System.Text.Json;
using Itca.Api.Data;
using Npgsql;

namespace Itca.Api.Features.Payments;

public sealed class PaymentQueries(SupabaseDb database)
{
    private static readonly HashSet<string> ValidStatuses =
    [
        "pending_payment",
        "paid",
        "failed",
        "cancelled",
        "expired",
        "manual_review",
        "refunded"
    ];

    public async Task<IReadOnlyList<PaymentOrderListItemDto>> ListPaymentOrdersAsync(
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken
    )
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        var conditions = new List<string>();
        if (!string.IsNullOrWhiteSpace(status) && ValidStatuses.Contains(status.Trim()))
        {
            conditions.Add("status = @status");
            command.Parameters.AddWithValue("status", status.Trim());
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            conditions.Add("""
                (
                  order_no ilike @keyword
                  or application_no ilike @keyword
                  or member_no ilike @keyword
                  or certificate_no ilike @keyword
                  or payer_name ilike @keyword
                  or payer_email ilike @keyword
                  or payer_phone ilike @keyword
                )
                """);
            command.Parameters.AddWithValue("keyword", $"%{keyword.Trim()}%");
        }

        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);
        command.Parameters.AddWithValue("limit", normalizedPageSize);
        command.Parameters.AddWithValue("offset", (normalizedPage - 1) * normalizedPageSize);

        command.CommandText = $"""
            select
              id,
              order_no,
              business_type,
              coalesce(application_no, member_no, certificate_no, business_id::text, ''),
              payer_name,
              amount,
              currency,
              provider,
              payment_channel,
              status,
              paid_at,
              updated_at,
              created_at
            from payment_orders
            {(conditions.Count > 0 ? $"where {string.Join(" and ", conditions)}" : string.Empty)}
            order by created_at desc
            limit @limit offset @offset;
            """;

        var orders = new List<PaymentOrderListItemDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            orders.Add(new PaymentOrderListItemDto(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetString(2),
                GetNullableString(reader, 3),
                GetNullableString(reader, 4),
                reader.GetDecimal(5),
                reader.GetString(6),
                reader.GetString(7),
                reader.GetString(8),
                reader.GetString(9),
                GetTimestampStringOrNull(reader, 10),
                GetTimestampString(reader, 11),
                GetTimestampString(reader, 12)
            ));
        }

        return orders;
    }

    public async Task<PaymentOrderDetailDto?> GetPaymentOrderAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var order = await GetPaymentOrderAsync(connection, id, cancellationToken);
        if (order is null)
        {
            return null;
        }

        var events = await ListPaymentEventsAsync(connection, id, cancellationToken);
        return order with { Events = events };
    }

    internal static async Task<PaymentOrderDetailDto?> GetPaymentOrderAsync(
        NpgsqlConnection connection,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              id,
              order_no,
              business_type,
              business_id,
              application_id,
              certification_application_id,
              certificate_id,
              application_no,
              member_no,
              certificate_no,
              payer_name,
              payer_email,
              payer_phone,
              amount,
              currency,
              fee_code,
              payment_channel,
              payment_method,
              provider,
              provider_order_id,
              provider_transaction_id,
              provider_payment_id,
              provider_callback_id,
              status,
              payment_proof_note,
              admin_note,
              internal_note,
              metadata,
              provider_payload,
              paid_at,
              failed_at,
              cancelled_at,
              expired_at,
              refunded_at,
              manual_review_at,
              confirmed_at,
              confirmed_by,
              cancelled_by,
              cancel_reason,
              refund_reason,
              created_by,
              created_at,
              updated_at
            from payment_orders
            where id = @id
            limit 1;
            """;
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? ReadPaymentOrder(reader, Array.Empty<PaymentEventDto>())
            : null;
    }

    private static async Task<IReadOnlyList<PaymentEventDto>> ListPaymentEventsAsync(
        NpgsqlConnection connection,
        Guid paymentOrderId,
        CancellationToken cancellationToken
    )
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select
              id,
              payment_order_id,
              order_no,
              event_type,
              from_status,
              to_status,
              provider,
              provider_event_id,
              provider_order_id,
              provider_transaction_id,
              message,
              admin_note,
              payload_json,
              created_by,
              created_at
            from payment_events
            where payment_order_id = @paymentOrderId
            order by created_at desc;
            """;
        command.Parameters.AddWithValue("paymentOrderId", paymentOrderId);

        var events = new List<PaymentEventDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            events.Add(new PaymentEventDto(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetString(3),
                GetNullableString(reader, 4),
                GetNullableString(reader, 5),
                reader.GetString(6),
                GetNullableString(reader, 7),
                GetNullableString(reader, 8),
                GetNullableString(reader, 9),
                GetNullableString(reader, 10),
                GetNullableString(reader, 11),
                GetJsonElement(reader, 12, redact: true) ?? EmptyObject(),
                GetNullableString(reader, 13, "system"),
                GetTimestampString(reader, 14)
            ));
        }

        return events;
    }

    private static PaymentOrderDetailDto ReadPaymentOrder(NpgsqlDataReader reader, IReadOnlyList<PaymentEventDto> events)
    {
        return new PaymentOrderDetailDto(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.GetString(2),
            GetNullableGuid(reader, 3),
            GetNullableGuid(reader, 4),
            GetNullableGuid(reader, 5),
            GetNullableGuid(reader, 6),
            GetNullableString(reader, 7),
            GetNullableString(reader, 8),
            GetNullableString(reader, 9),
            GetNullableString(reader, 10),
            GetNullableString(reader, 11),
            GetNullableString(reader, 12),
            reader.GetDecimal(13),
            reader.GetString(14),
            GetNullableString(reader, 15),
            reader.GetString(16),
            GetNullableString(reader, 17),
            reader.GetString(18),
            GetNullableString(reader, 19),
            GetNullableString(reader, 20),
            GetNullableString(reader, 21),
            GetNullableString(reader, 22),
            reader.GetString(23),
            GetNullableString(reader, 24),
            GetNullableString(reader, 25),
            GetNullableString(reader, 26),
            GetJsonElement(reader, 27, redact: true) ?? EmptyObject(),
            GetJsonElement(reader, 28, redact: true),
            GetTimestampStringOrNull(reader, 29),
            GetTimestampStringOrNull(reader, 30),
            GetTimestampStringOrNull(reader, 31),
            GetTimestampStringOrNull(reader, 32),
            GetTimestampStringOrNull(reader, 33),
            GetTimestampStringOrNull(reader, 34),
            GetTimestampStringOrNull(reader, 35),
            GetNullableString(reader, 36),
            GetNullableString(reader, 37),
            GetNullableString(reader, 38),
            GetNullableString(reader, 39),
            GetNullableString(reader, 40, "system"),
            GetTimestampString(reader, 41),
            GetTimestampString(reader, 42),
            events
        );
    }

    private static Guid? GetNullableGuid(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetGuid(ordinal);
    }

    private static string GetNullableString(NpgsqlDataReader reader, int ordinal, string fallback = "")
    {
        return reader.IsDBNull(ordinal) ? fallback : reader.GetString(ordinal);
    }

    private static string GetTimestampString(NpgsqlDataReader reader, int ordinal)
    {
        return GetTimestampStringOrNull(reader, ordinal) ?? string.Empty;
    }

    private static string? GetTimestampStringOrNull(NpgsqlDataReader reader, int ordinal)
    {
        return reader.IsDBNull(ordinal) ? null : reader.GetFieldValue<DateTime>(ordinal).ToString("O");
    }

    private static JsonElement? GetJsonElement(NpgsqlDataReader reader, int ordinal, bool redact)
    {
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        using var document = JsonDocument.Parse(reader.GetString(ordinal));
        if (!redact)
        {
            return document.RootElement.Clone();
        }

        return RedactJson(document.RootElement).Clone();
    }

    private static JsonElement EmptyObject()
    {
        using var document = JsonDocument.Parse("{}");
        return document.RootElement.Clone();
    }

    private static JsonElement RedactJson(JsonElement element)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            WriteRedactedJson(writer, element);
        }

        using var redacted = JsonDocument.Parse(stream.ToArray());
        return redacted.RootElement.Clone();
    }

    private static void WriteRedactedJson(Utf8JsonWriter writer, JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var property in element.EnumerateObject())
                {
                    writer.WritePropertyName(property.Name);
                    if (IsSensitiveJsonKey(property.Name))
                    {
                        writer.WriteStringValue("[redacted]");
                    }
                    else
                    {
                        WriteRedactedJson(writer, property.Value);
                    }
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray())
                {
                    WriteRedactedJson(writer, item);
                }
                writer.WriteEndArray();
                break;
            default:
                element.WriteTo(writer);
                break;
        }
    }

    private static bool IsSensitiveJsonKey(string key)
    {
        return key.Contains("token", StringComparison.OrdinalIgnoreCase)
            || key.Contains("secret", StringComparison.OrdinalIgnoreCase)
            || key.Contains("key", StringComparison.OrdinalIgnoreCase)
            || key.Contains("password", StringComparison.OrdinalIgnoreCase)
            || key.Contains("connection", StringComparison.OrdinalIgnoreCase)
            || key.Contains("storage_path", StringComparison.OrdinalIgnoreCase)
            || key.Contains("storagePath", StringComparison.OrdinalIgnoreCase)
            || key.Contains("vt", StringComparison.OrdinalIgnoreCase);
    }
}
