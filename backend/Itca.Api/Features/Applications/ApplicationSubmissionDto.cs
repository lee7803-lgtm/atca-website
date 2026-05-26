namespace Itca.Api.Features.Applications;

public sealed record ApplicationSubmissionRequest(
    string? ApplicationType,
    string? Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Country,
    string? Profile,
    string? Purpose,
    string? OrganizationType,
    bool ReceiveNotice,
    bool TruthConfirmed,
    bool TermsAccepted,
    bool PrivacyAccepted,
    string? CompanyWebsite,
    string? WebsiteUrl
);

public sealed record ApplicationSubmissionResult(
    string ApplicationNo,
    string ApplicationType,
    string Status
);

public sealed class ApplicationValidationException(
    string message,
    IReadOnlyDictionary<string, string> fieldErrors
) : Exception(message)
{
    public IReadOnlyDictionary<string, string> FieldErrors { get; } = fieldErrors;
}

public sealed class OpenApplicationAlreadyExistsException : Exception
{
    public OpenApplicationAlreadyExistsException()
        : base("An open application already exists for this contact.")
    {
    }
}
