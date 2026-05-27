namespace Itca.Api.Features.Members;

public sealed record MemberPublicDto(
    string MemberNo,
    string HolderName,
    string MemberType,
    string Status,
    string StatusLabel,
    string RegisteredAt,
    string ApprovedAt,
    string Issuer,
    string VerificationNote
);
