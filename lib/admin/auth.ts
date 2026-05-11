import { createHash, timingSafeEqual } from "node:crypto";

export const adminSessionCookieName = "atca_admin_session";

export class AdminConfigError extends Error {
  constructor() {
    super("Missing ADMIN_PASSWORD");
  }
}

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new AdminConfigError();
  }

  return password;
}

export function createAdminSessionToken() {
  return createHash("sha256").update(`atca-admin:${getAdminPassword()}`).digest("hex");
}

export function isValidAdminSessionToken(value?: string) {
  if (!value) return false;

  try {
    const expected = createAdminSessionToken();
    const receivedBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);

    if (receivedBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  const receivedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
