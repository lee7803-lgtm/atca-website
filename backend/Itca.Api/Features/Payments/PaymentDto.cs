using System.Text.Json;

namespace Itca.Api.Features.Payments;

public sealed record PaymentOrderListItemDto(
    Guid Id,
    string OrderNo,
    string BusinessType,
    string BusinessReference,
    string PayerName,
    decimal Amount,
    string Currency,
    string Provider,
    string PaymentChannel,
    string Status,
    string? PaidAt,
    string UpdatedAt,
    string CreatedAt
);

public sealed record PaymentOrderDetailDto(
    Guid Id,
    string OrderNo,
    string BusinessType,
    Guid? BusinessId,
    Guid? ApplicationId,
    Guid? CertificationApplicationId,
    Guid? CertificateId,
    string ApplicationNo,
    string MemberNo,
    string CertificateNo,
    string PayerName,
    string PayerEmail,
    string PayerPhone,
    decimal Amount,
    string Currency,
    string FeeCode,
    string PaymentChannel,
    string PaymentMethod,
    string Provider,
    string ProviderOrderId,
    string ProviderTransactionId,
    string ProviderPaymentId,
    string ProviderCallbackId,
    string Status,
    string PaymentProofNote,
    string AdminNote,
    string InternalNote,
    JsonElement Metadata,
    JsonElement? ProviderPayload,
    string? PaidAt,
    string? FailedAt,
    string? CancelledAt,
    string? ExpiredAt,
    string? RefundedAt,
    string? ManualReviewAt,
    string? ConfirmedAt,
    string ConfirmedBy,
    string CancelledBy,
    string CancelReason,
    string RefundReason,
    string CreatedBy,
    string CreatedAt,
    string UpdatedAt,
    IReadOnlyList<PaymentEventDto> Events
);

public sealed record PaymentEventDto(
    Guid Id,
    Guid PaymentOrderId,
    string OrderNo,
    string EventType,
    string FromStatus,
    string ToStatus,
    string Provider,
    string ProviderEventId,
    string ProviderOrderId,
    string ProviderTransactionId,
    string Message,
    string AdminNote,
    JsonElement PayloadJson,
    string CreatedBy,
    string CreatedAt
);

public sealed record PaymentStatusUpdateRequest(
    string? Status,
    string? AdminNote
);

public sealed record PaymentStatusUpdateResult(
    PaymentOrderDetailDto Order
);

public sealed record PaymentOrderCreateRequest(
    string? SourceType,
    Guid? SourceId,
    string? BusinessType,
    decimal? Amount,
    string? Currency,
    string? Provider,
    string? PaymentChannel,
    string? AdminNote
);

public sealed record PaymentOrderCreateResult(
    PaymentOrderDetailDto Order,
    bool Created,
    string Message
);
