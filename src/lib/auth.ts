import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ds_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // a week

export type Session = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "editor";
};

/* `jose` is used rather than `jsonwebtoken` because proxy.ts may run outside the
   Node runtime, where the crypto APIs jsonwebtoken needs are unavailable. */
function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random value in .env.local.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Returns the session for a token, or null if it is missing, expired or tampered with. */
export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.id || !payload.email) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name ?? "Administrator"),
      role: payload.role === "editor" ? "editor" : "owner",
    };
  } catch {
    return null;
  }
}

/** The signed-in admin for the current request, read from the cookie. */
export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript, so XSS cannot steal it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
