using Npgsql;

namespace Itca.Api.Data;

public sealed class SupabaseDb(IConfiguration configuration)
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

        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        return connection;
    }
}

public sealed class SupabaseDbConfigurationException(string environmentVariable)
    : Exception($"Supabase PostgreSQL connection string is not configured. Set {environmentVariable}.")
{
    public string EnvironmentVariable { get; } = environmentVariable;
}
