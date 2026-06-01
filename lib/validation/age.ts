export const adultBirthDateMessage = "申请人需年满 18 岁，出生日期不能是未来日期。";

export function getAdultBirthDateError(value: string, minAge = 18) {
  const trimmed = value.trim();
  if (!trimmed) return adultBirthDateMessage;

  const birthDate = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) return "请填写有效出生日期。";

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (birthDate > todayUtc) return adultBirthDateMessage;

  const minimumBirthDate = new Date(Date.UTC(todayUtc.getUTCFullYear() - minAge, todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
  if (birthDate > minimumBirthDate) return adultBirthDateMessage;

  return "";
}
