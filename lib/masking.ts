export function maskName(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (text.length <= 1) return `${text}*`;
  return `${text.slice(0, 1)}${"*".repeat(Math.min(text.length - 1, 2))}`;
}

export function maskApplicationNo(value: string) {
  if (value.length <= 4) return value;
  return `${value.slice(0, -2)}**`;
}

export function maskContact(value: string) {
  const text = value.trim();
  if (!text) return "";

  if (text.includes("@")) {
    const [name, domain] = text.split("@");
    return `${name.slice(0, 2)}***@${domain ? domain.replace(/^(.).+(\..+)$/, "$1***$2") : "***"}`;
  }

  if (text.length <= 4) return "****";
  return `${text.slice(0, 3)}****${text.slice(-2)}`;
}
