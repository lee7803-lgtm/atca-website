namespace Itca.Api.Features.Certificates;

public sealed record CertificatePublicDto(
    string CertificateNo,
    string HolderName,
    string TaoistName,
    string TaoistRank,
    string Sect,
    string CertificationPath,
    string CertificationLevel,
    string LineageOrTemple,
    string IssuedDate,
    string ValidFrom,
    string ValidUntil,
    string Status,
    string VerificationUrl
);
