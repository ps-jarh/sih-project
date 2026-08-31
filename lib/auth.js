import crypto from "crypto";

export const SESSION_COOKIE = "tc_session";
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

/** scrypt with a random salt — no external deps, no plaintext passwords at rest. */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof password !== "string" || password.length === 0) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b); // constant-time compare, no timing side-channel
}

/**
 * Sessions live in the same in-memory store as the ledger (see lib/store.js) —
 * consistent with this project's single-node scoping. A real deployment would
 * put these in Redis/a DB alongside swapping lib/store.js for persistence.
 */
export function createSession(store, institutionId) {
  const token = crypto.randomBytes(32).toString("hex");
  store.sessions.set(token, { institutionId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(store, token) {
  if (!token) return null;
  const session = store.sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    store.sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(store, token) {
  if (token) store.sessions.delete(token);
}
