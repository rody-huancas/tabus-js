import { describe, it, expect, vi } from "vitest";
import { generateId } from "../src/core/generate-id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("generateId", () => {
  it("returns a string matching UUID format", () => {
    expect(generateId()).toMatch(UUID_RE);
  });

  it("returns a different value on each call", () => {
    expect(generateId()).not.toBe(generateId());
  });

  it("generates 100 unique IDs without collision", () => {
    const ids = Array.from({ length: 100 }, () => generateId());
    expect(new Set(ids).size).toBe(100);
  });

  it("falls back to manual UUID when crypto.randomUUID is unavailable", () => {
    const original = (globalThis as any).crypto?.randomUUID;

    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value       : undefined,
      configurable: true,
      writable    : true,
    });

    const id = generateId();

    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value       : original,
      configurable: true,
      writable    : true,
    });

    expect(id).toMatch(UUID_RE);
  });
});
