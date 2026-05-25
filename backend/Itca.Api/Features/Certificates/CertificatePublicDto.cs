namespace Itca.Api.Features.Certificates;

public sealed record CertificatePublicDto(
    string CertificateNo,
    string HolderName,
    string CertificationType,
    string CertificationPath,
    string CertificationLevel,
    string Issuer,
    string IssuedDate,
    string ValidFrom,
    string ValidUntil,
    string Status,
    string DetailUrl
);
