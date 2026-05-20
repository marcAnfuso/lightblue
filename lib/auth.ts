import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const COOKIE_NAME = "lb_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 días

function getSecretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error("AUTH_SECRET no está seteada o es muy corta (mínimo 16 chars)");
  }
  return new TextEncoder().encode(raw);
}

export const authCookieName = COOKIE_NAME;
export const authMaxAgeSeconds = MAX_AGE_SECONDS;

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ ok: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey(), { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}
