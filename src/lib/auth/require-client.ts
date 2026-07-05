import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionToken,
} from "@/lib/auth/client-session";

export async function getClientId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CLIENT_SESSION_COOKIE)?.value;
  return token ? verifyClientSessionToken(token) : null;
}

export async function requireClientId(): Promise<string> {
  const clientId = await getClientId();
  if (!clientId) throw new Error("Unauthorized");
  return clientId;
}
