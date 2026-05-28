using System.Text.Json;
using Itca.Api.Data;
using Npgsql;
using NpgsqlTypes;

namespace Itca.Api.Features.Admin;

public sealed class AuditLogWriter(SupabaseDb database, ILogger<AuditLogWriter> logger)
{
    public async Task WriteAsync(AuditLogEntry entry, CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await database.OpenConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = """
                insert into audit_logs (
                  actor_admin_id,
                  actor_email,
                  actor_name,
                  actor_role,
                  actor_type,
                  action,
                  resource_type,
                  resource_id,
                  resource_no,
                  before_data,
                  after_data,
                  summary,
                  ip_address,
                  user_agent
                )
                values (
                  @actorAdminId,
                  @actorEmail,
                  @actorName,
                  @actorRole,
                  @actorType,
                  @action,
                  @resourceType,
                  @resourceId,
                  @resourceNo,
                  @beforeData,
                  @afterData,
                  @summary,
                  @ipAddress,
                  @userAgent
                );
                """;

            AddNullableUuidParameter(command, "actorAdminId", entry.ActorAdminId);
            AddNullableTextParameter(command, "actorEmail", entry.ActorEmail);
            AddNullableTextParameter(command, "actorName", entry.ActorName);
            AddNullableTextParameter(command, "actorRole", entry.ActorRole);
            command.Parameters.AddWithValue("actorType", string.IsNullOrWhiteSpace(entry.ActorType) ? "system" : entry.ActorType);
            command.Parameters.AddWithValue("action", entry.Action);
            command.Parameters.AddWithValue("resourceType", entry.ResourceType);
            AddNullableTextParameter(command, "resourceId", entry.ResourceId);
            AddNullableTextParameter(command, "resourceNo", entry.ResourceNo);
            AddJsonbParameter(command, "beforeData", entry.BeforeData);
            AddJsonbParameter(command, "afterData", entry.AfterData);
            AddNullableTextParameter(command, "summary", entry.Summary);
            AddNullableTextParameter(command, "ipAddress", entry.IpAddress);
            AddNullableTextParameter(command, "userAgent", entry.UserAgent);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception error)
        {
            logger.LogWarning(
                error,
                "Audit log write failed. Action={Action}; ResourceType={ResourceType}; ResourceId={ResourceId}",
                entry.Action,
                entry.ResourceType,
                entry.ResourceId
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

    private static void AddJsonbParameter(NpgsqlCommand command, string name, object? value)
    {
        var parameter = command.Parameters.Add(name, NpgsqlDbType.Jsonb);
        parameter.Value = value is null ? DBNull.Value : JsonSerializer.Serialize(value);
    }
}

public sealed record AuditLogEntry(
    Guid? ActorAdminId,
    string? ActorEmail,
    string? ActorName,
    string? ActorRole,
    string ActorType,
    string Action,
    string ResourceType,
    string? ResourceId,
    string? ResourceNo,
    object? BeforeData,
    object? AfterData,
    string? Summary,
    string? IpAddress,
    string? UserAgent
);

public sealed record AdminActorContext(
    Guid? AdminId,
    string? Email,
    string? Name,
    string? Role,
    string ActorType,
    string? IpAddress,
    string? UserAgent
);
