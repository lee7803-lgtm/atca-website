namespace Itca.Api.Features.Applications;

public sealed record ApplicationProgressDto(
    string ApplicationNo,
    string ApplicationType,
    string Name,
    string Status,
    string AdminNote,
    string? CertificateNo,
    string? CertificateDetailUrl,
    string? CertificateStatus,
    string? CertificateHolderName,
    string? CertificateTaoistName,
    string? CertificationPath,
    string? CertificationLevel,
    string? CertificateLineageOrTemple,
    string? CertificateIssuer,
    string? CertificateIssuedDate,
    string? CertificateValidFrom,
    string? CertificateValidUntil,
    bool? CertificatePhotoRecorded,
    string? DeliveryStatus,
    string? DeliveredAt,
    string? SupplementSubmittedAt,
    bool HasSupplementalSubmission,
    IReadOnlyDictionary<string, string>? EditableData,
    string CreatedAt,
    string UpdatedAt
);
