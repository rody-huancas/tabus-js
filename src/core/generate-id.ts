/**
 * Generates a RFC-4122 v4 UUID string.
 * Uses `crypto.randomUUID()` when available; falls back to a `Math.random`-based
 * implementation for environments that lack the Web Crypto API.
 */
export const generateId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return (crypto as Crypto).randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
