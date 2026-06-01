export const personNameLengthMessage = "请填写姓名，长度 2-50 个字符。";
export const organizationNameLengthMessage = "请填写机构名称，长度 2-80 个字符。";
export const chineseNameMessage = "中文姓名请以中文为主，可包含“·”或少量空格，长度 2-50 个字符。";
export const latinNameMessage = "请填写英文、拼音或拉丁字母姓名，可包含空格、连字符或撇号。";

export function hasValidLength(value: string, min: number, max: number) {
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function isChinesePersonName(value: string) {
  const trimmed = value.trim();
  if (!hasValidLength(trimmed, 2, 50)) return false;
  if (!/[\u4e00-\u9fff]/.test(trimmed)) return false;
  return /^[\u4e00-\u9fff·\s]+$/.test(trimmed);
}

export function isLatinName(value: string) {
  const trimmed = value.trim();
  if (!hasValidLength(trimmed, 2, 80)) return false;
  if (/[\u4e00-\u9fff]/.test(trimmed)) return false;
  return /^[A-Za-z][A-Za-z\s'-]*$/.test(trimmed);
}
