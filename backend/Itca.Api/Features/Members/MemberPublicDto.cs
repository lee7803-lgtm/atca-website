namespace Itca.Api.Features.Members;

public sealed record MemberPublicDto(
    string MemberNo,
    string HolderName,
    string MemberType,
    string Status,
    string StatusLabel,
    string? MemberValidFrom,
    string? MemberValidUntil,
    string MemberStatus,
    string MemberRenewalStatus,
    string EffectiveStatus,
    string EffectiveStatusLabel,
    int? DaysUntilExpiry,
    string ExpiryBucket,
    string RegisteredAt,
    string ApprovedAt,
    string Issuer,
    string VerificationNote
);
