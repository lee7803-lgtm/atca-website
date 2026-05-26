using System.Text.Json;

namespace Itca.Api.Features.Applications;

public sealed record ApplicationAdminDto(
    Guid Id,
    string ApplicationNo,
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
