import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookieName = "atca_admin_session";

export type AdminSession = {
  actorType: "admin" | "legacy_admin";
  adminId?: string;
  email?: string;
  displayName?: string;
  role?: string;
};

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

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signAdminSessionPayload(payload: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest("base64url");
}

export function createAdminUserSessionToken(admin: { id: string; email: string; displayName: string; role: string }) {
  const payload = base64UrlEncode(
    JSON.stringify({
      actorType: "admin",
      adminId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role
    } satisfies AdminSession)
  );

  return `v2.${payload}.${signAdminSessionPayload(payload)}`;
}

function isValidLegacyAdminSessionToken(value?: string) {
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

export function getAdminSession(value?: string): AdminSession | null {
  if (!value) return null;

  if (isValidLegacyAdminSessionToken(value)) {
    return {
      actorType: "legacy_admin",
      displayName: "Legacy Admin",
      role: "admin"
    };
  }

  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v2") return null;

  try {
    const [, payload, signature] = parts;
    const expected = signAdminSessionPayload(payload);
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return null;
    }

    const session = JSON.parse(base64UrlDecode(payload)) as AdminSession;
    if (session.actorType !== "admin" || !session.adminId || !session.email || !session.displayName || !session.role) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function isValidAdminSessionToken(value?: string) {
  return getAdminSession(value) !== null;
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  const receivedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
