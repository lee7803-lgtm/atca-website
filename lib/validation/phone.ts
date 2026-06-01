export const internationalPhoneMessage = "请填写包含国际区号的联系电话，例如 +60 12 345 6789 或 +86 138 0000 0000。";

export function isInternationalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return false;
  if (trimmed.length < 8 || trimmed.length > 30) return false;
  if (!/^\+[0-9][0-9\s().-]*$/.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
