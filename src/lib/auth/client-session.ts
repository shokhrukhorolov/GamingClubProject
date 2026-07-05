import { SignJWT, jwtVerify } from "jose";

export const CLIENT_SESSION_COOKIE = "gc_client_session";
export const CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createClientSessionToken(clientId: string): Promise<string> {
  return new SignJWT({ role: "client" })
    .setSubject(clientId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CLIENT_SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Returns the clientId, or null when the token is missing/invalid/not a client token. */
export async function verifyClientSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "client" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
