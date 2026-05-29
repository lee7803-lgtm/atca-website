namespace Itca.Api.Features.Validity;

public sealed record EffectiveValidityStatus(
    string EffectiveStatus,
    string EffectiveStatusLabel,
    int? DaysUntilExpiry,
    string ExpiryBucket
);

public static class ValidityCalculator
{
    private const int ExpiringSoonDays = 60;

    public static EffectiveValidityStatus ForMember(
        string? memberStatus,
        string? renewalStatus,
        DateOnly? validUntil,
        DateOnly today
    )
    {
        if (Is(memberStatus, "revoked")) return Build("revoked", "已撤销", validUntil, today);
        if (Is(memberStatus, "terminated")) return Build("terminated", "已终止", validUntil, today);
        if (Is(memberStatus, "suspended")) return Build("suspended", "已暂停", validUntil, today);
        if (Is(renewalStatus, "pending_renewal")) return Build("pending_renewal", "待续期", validUntil, today);
        if (Is(renewalStatus, "renewal_in_progress") || Is(renewalStatus, "pending_review")) return Build("renewal_in_progress", "续期中", validUntil, today);
        if (Is(renewalStatus, "renewed")) return Build("renewed", "已续期", validUntil, today);
        if (!validUntil.HasValue) return Build("validity_not_set", "有效期未设置", validUntil, today);

        var days = validUntil.Value.DayNumber - today.DayNumber;
        if (days < 0) return Build("expired", "已过期", validUntil, today);
        if (days <= ExpiringSoonDays) return Build("expiring_soon", "即将到期", validUntil, today);
        return Build("active", "有效", validUntil, today);
    }

    public static EffectiveValidityStatus ForCertificate(
        string? status,
        string? reviewStatus,
        DateOnly? validUntil,
        DateOnly today
    )
    {
        if (Is(status, "revoked")) return Build("revoked", "已撤销", validUntil, today);
        if (Is(status, "pending")) return Build("pending", "待签发", validUntil, today);
        if (Is(status, "expired")) return Build("expired", "已过期", validUntil, today);
        if (Is(reviewStatus, "suspended")) return Build("suspended", "已暂停", validUntil, today);
        if (Is(reviewStatus, "pending_renewal")) return Build("pending_renewal", "待续期", validUntil, today);
        if (Is(reviewStatus, "renewal_in_progress") || Is(reviewStatus, "pending_review")) return Build("renewal_in_progress", "续期中", validUntil, today);
        if (Is(reviewStatus, "reviewed") || Is(reviewStatus, "renewed")) return Build("renewed", "已续期", validUntil, today);
        if (!validUntil.HasValue) return Build("validity_not_set", "有效期未设置", validUntil, today);

        var days = validUntil.Value.DayNumber - today.DayNumber;
        if (days < 0) return Build("expired", "已过期", validUntil, today);
        if (days <= ExpiringSoonDays) return Build("expiring_soon", "即将到期", validUntil, today);
        return Build("valid", "有效", validUntil, today);
    }

    private static EffectiveValidityStatus Build(string status, string label, DateOnly? validUntil, DateOnly today)
    {
        var days = validUntil.HasValue ? validUntil.Value.DayNumber - today.DayNumber : (int?)null;
        return new EffectiveValidityStatus(status, label, days, GetExpiryBucket(days));
    }

    private static string GetExpiryBucket(int? days)
    {
        if (!days.HasValue) return "not_set";
        if (days.Value < 0) return "expired";
        if (days.Value <= 7) return "within_7_days";
        if (days.Value <= 30) return "within_30_days";
        if (days.Value <= ExpiringSoonDays) return "within_60_days";
        return "active";
    }

    private static bool Is(string? value, string expected)
    {
        return string.Equals(value?.Trim(), expected, StringComparison.OrdinalIgnoreCase);
    }
}
