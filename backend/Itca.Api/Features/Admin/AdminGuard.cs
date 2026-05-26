using System.Security.Cryptography;
using System.Text;

namespace Itca.Api.Features.Admin;

public static class AdminGuard
{
    public const string HeaderName = "X-ITCA-ADMIN-API-TOKEN";
    public const string TokenEnvironmentVariable = "ITCA_ADMIN_API_TOKEN";

    public static void RequireAdminToken(HttpRequest request)
    {
        var expectedToken = Environment.GetEnvironmentVariable(TokenEnvironmentVariable);
        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            throw new AdminTokenConfigurationException(TokenEnvironmentVariable);
        }

        var receivedToken = request.Headers[HeaderName].ToString();
        if (string.IsNullOrWhiteSpace(receivedToken) || !SecureEquals(receivedToken, expectedToken))
        {
            throw new AdminUnauthorizedException();
        }
    }

    private static bool SecureEquals(string received, string expected)
    {
        var receivedBytes = Encoding.UTF8.GetBytes(received);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);

        return receivedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(receivedBytes, expectedBytes);
    }
}

public sealed class AdminTokenConfigurationException(string environmentVariable)
    : Exception("Admin API token is not configured.")
{
    public string EnvironmentVariable { get; } = environmentVariable;
}

public sealed class AdminUnauthorizedException : Exception
{
    public AdminUnauthorizedException()
        : base("Admin API token is invalid.")
    {
    }
}
