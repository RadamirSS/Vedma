import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function deriveKey(password: string, salt: string) {
  return scryptSync(password, salt, KEY_LENGTH);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = deriveKey(password, salt).toString("hex");
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, key] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const derived = deriveKey(password, salt);
  const stored = Buffer.from(key, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}
