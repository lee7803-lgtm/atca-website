using System.Text.Json;

namespace Itca.Api.Features.Applications;

public sealed record ApplicationAdminDto(
    Guid Id,
    string ApplicationNo,
    string MemberNo,
    string? MemberNoIssuedAt,
    string MemberNoIssuedBy,
    string ApplicationNoScheme,
    string ApplicationType,
    string Status,
    string Name,
    string ContactName,
    string Phone,
    string Email,
    string Country,
    string? OrganizationType,
    string Profile,
    string Purpose,
    bool ReceiveNotice,
    bool TruthConfirmed,
    bool TermsAccepted,
    bool PrivacyAccepted,
    string ConfirmedAt,
    string AdminNote,
    JsonElement[] SupplementalSubmissions,
    string? SupplementSubmittedAt,
    string CreatedAt,
    string UpdatedAt
);

public sealed record ApplicationAdminReviewRequest(
    string? Status,
    string? AdminNote
);

public sealed record ApplicationAdminReviewSummaryDto(
    Guid Id,
    string ApplicationNo,
    string MemberNo,
    string ApplicationType,
    string Status,
    string AdminNote,
    string UpdatedAt
);
