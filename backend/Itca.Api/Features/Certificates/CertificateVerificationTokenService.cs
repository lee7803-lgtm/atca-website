using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Itca.Api.Features.Certificates;

public sealed class CertificateVerificationTokenService
{
    public const string SecretEnvironmentVariable = "ITCA_VERIFICATION_TOKEN_SECRET";

    private static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(15);
    private readonly byte[] secret;

    public CertificateVerificationTokenService()
    {
        var configuredSecret = Environment.GetEnvironmentVariable(SecretEnvironmentVariable);
        secret = string.IsNullOrWhiteSpace(configuredSecret)
            ? RandomNumberGenerator.GetBytes(32)
            : Encoding.UTF8.GetBytes(configuredSecret);
    }

    public string CreateToken(string certificateNo)
    {
        var payload = new CertificateVerificationTokenPayload(
            certificateNo.Trim(),
            DateTimeOffset.UtcNow.Add(TokenLifetime).ToUnixTimeSeconds()
        );
        var payloadBytes = JsonSerializer.SerializeToUtf8Bytes(payload);
        var payloadPart = Base64UrlEncode(payloadBytes);
        var signaturePart = Base64UrlEncode(Sign(payloadPart));

        return $"{payloadPart}.{signaturePart}";
    }

    public CertificateVerificationTokenValidationResult ValidateToken(string? token, string certificateNo)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return CertificateVerificationTokenValidationResult.Missing;
        }

        var parts = token.Split('.', 2);
        if (parts.Length != 2 || string.IsNullOrWhiteSpace(parts[0]) || string.IsNullOrWhiteSpace(parts[1]))
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }

        var expectedSignature = Sign(parts[0]);
        byte[] actualSignature;
        try
        {
            actualSignature = Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }

        if (!CryptographicOperations.FixedTimeEquals(expectedSignature, actualSignature))
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }

        CertificateVerificationTokenPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<CertificateVerificationTokenPayload>(Base64UrlDecode(parts[0]));
        }
        catch (JsonException)
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }
        catch (FormatException)
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }

        if (payload is null || string.IsNullOrWhiteSpace(payload.CertificateNo))
        {
            return CertificateVerificationTokenValidationResult.Invalid;
        }

        if (payload.ExpiresAtUnixSeconds < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
        {
            return CertificateVerificationTokenValidationResult.Expired;
        }

        return string.Equals(payload.CertificateNo, certificateNo.Trim(), StringComparison.Ordinal)
            ? CertificateVerificationTokenValidationResult.Valid
            : CertificateVerificationTokenValidationResult.CertificateMismatch;
    }

    public static string BuildDetailUrl(string certificateNo, string token)
    {
        return $"/certificates/{Uri.EscapeDataString(certificateNo.Trim())}?vt={Uri.EscapeDataString(token)}";
    }

    private byte[] Sign(string payloadPart)
    {
        using var hmac = new HMACSHA256(secret);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadPart));
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var base64 = value.Replace('-', '+').Replace('_', '/');
        base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');

        return Convert.FromBase64String(base64);
    }

    private sealed record CertificateVerificationTokenPayload(
        string CertificateNo,
        long ExpiresAtUnixSeconds
    );
}

public enum CertificateVerificationTokenValidationResult
{
    Valid,
    Missing,
    Invalid,
    Expired,
    CertificateMismatch
}
