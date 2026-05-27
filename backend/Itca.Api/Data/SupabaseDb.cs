using Npgsql;

namespace Itca.Api.Data;

public sealed class SupabaseDb(IConfiguration configuration, ILogger<SupabaseDb> logger)
{
    public const string ConnectionStringEnvironmentVariable = "ITCA_SUPABASE_DB_CONNECTION_STRING";

    public async Task<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariable)
            ?? configuration.GetSection("Supabase:Postgres")["ConnectionString"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new SupabaseDbConfigurationException(ConnectionStringEnvironmentVariable);
        }

        var normalizedConnectionString = NormalizeConnectionString(connectionString);
        var connection = new NpgsqlConnection(normalizedConnectionString);

        try
        {
            await connection.OpenAsync(cancellationToken);
        }
        catch (NpgsqlException error)
        {
            logger.LogError(
                error,
                "Supabase PostgreSQL connection failed. ErrorType={ErrorType}; SqlState={SqlState}",
                error.GetType().Name,
                error is PostgresException postgresError ? postgresError.SqlState : "NpgsqlConnection"
            );
            await connection.DisposeAsync();
            throw;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }

        return connection;
    }

    private string NormalizeConnectionString(string connectionString)
    {
        var trimmedConnectionString = connectionString.Trim();
        if (!trimmedConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !trimmedConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            ValidateConnectionString(trimmedConnectionString);
            return trimmedConnectionString;
        }

        if (!Uri.TryCreate(trimmedConnectionString, UriKind.Absolute, out var uri)
            || string.IsNullOrWhiteSpace(uri.Host)
            || string.IsNullOrWhiteSpace(uri.UserInfo))
        {
            logger.LogError(
                "Supabase PostgreSQL connection string uses URI format but is missing required host or user info."
            );
            throw new ArgumentException("Supabase PostgreSQL connection URI format is invalid.");
        }

        var userInfoParts = uri.UserInfo.Split(':', 2);
        if (userInfoParts.Length != 2
            || string.IsNullOrWhiteSpace(userInfoParts[0])
            || string.IsNullOrEmpty(userInfoParts[1]))
        {
            logger.LogError(
                "Supabase PostgreSQL connection string uses URI format but is missing username or password."
            );
            throw new ArgumentException("Supabase PostgreSQL connection URI format is invalid.");
        }

        var database = uri.AbsolutePath.Trim('/');
        if (string.IsNullOrWhiteSpace(database))
        {
            database = "postgres";
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = Uri.UnescapeDataString(database),
            Username = Uri.UnescapeDataString(userInfoParts[0]),
            Password = Uri.UnescapeDataString(userInfoParts[1]),
            SslMode = SslMode.Require,
            Pooling = true
        };

        ApplyUriQueryOptions(uri.Query, builder);

        logger.LogInformation(
            "Supabase PostgreSQL connection string parsed from URI format. HostKind={HostKind}; Port={Port}; DatabaseConfigured={DatabaseConfigured}; UsernamePattern={UsernamePattern}; SslMode={SslMode}",
            GetHostKind(uri.Host),
            builder.Port,
            !string.IsNullOrWhiteSpace(builder.Database),
            GetUsernamePattern(builder.Username),
            builder.SslMode
        );

        return builder.ConnectionString;
    }

    private void ValidateConnectionString(string connectionString)
    {
        try
        {
            _ = new NpgsqlConnectionStringBuilder(connectionString);
        }
        catch (ArgumentException)
        {
            logger.LogError(
                "Supabase PostgreSQL connection string could not be parsed as an Npgsql key-value connection string."
            );
            throw;
        }
    }

    private static void ApplyUriQueryOptions(string query, NpgsqlConnectionStringBuilder builder)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return;
        }

        foreach (var segment in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = segment.Split('=', 2);
            if (parts.Length != 2)
            {
                continue;
            }

            var key = Uri.UnescapeDataString(parts[0]).Trim();
            var value = Uri.UnescapeDataString(parts[1]).Trim();

            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase)
                || key.Equals("ssl mode", StringComparison.OrdinalIgnoreCase))
            {
                builder.SslMode = Enum.Parse<SslMode>(value, ignoreCase: true);
            }
        }
    }

    private static string GetHostKind(string host)
    {
        if (host.EndsWith(".pooler.supabase.com", StringComparison.OrdinalIgnoreCase))
        {
            return "SupabasePooler";
        }

        if (host.EndsWith(".supabase.co", StringComparison.OrdinalIgnoreCase))
        {
            return "SupabaseDirect";
        }

        return "Other";
    }

    private static string GetUsernamePattern(string username)
    {
        if (username.StartsWith("postgres.", StringComparison.OrdinalIgnoreCase))
        {
            return "PoolerProjectScoped";
        }

        if (username.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            return "Postgres";
        }

        return "Other";
    }
}

public sealed class SupabaseDbConfigurationException(string environmentVariable)
    : Exception($"Supabase PostgreSQL connection string is not configured. Set {environmentVariable}.")
{
    public string EnvironmentVariable { get; } = environmentVariable;
}
