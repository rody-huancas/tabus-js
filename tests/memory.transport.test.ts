import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TabusMessage } from "../src/core/types";
import { MemoryTransport, __resetMemoryBus } from "../src/transport/memory.transport";

const msg = (tabId = "t1", event = "e", payload: unknown = null): TabusMessage => ({
  tabId,
  event,
  payload,
});

describe("MemoryTransport", () => {
  beforeEach(() => {
    __resetMemoryBus();
  });

  it("delivers messages to all listeners on the same channel", () => {
    const t1 = new MemoryTransport("ch");
    const t2 = new MemoryTransport("ch");

    const received: TabusMessage[] = [];
    t2.onMessage((m) => received.push(m));

    t1.send(msg("t1", "hello", 42));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ tabId: "t1", event: "hello", payload: 42 });

    t1.destroy();
    t2.destroy();
  });

  it("also delivers to the sender (no self-filtering at transport level)", () => {
    const t1 = new MemoryTransport("ch");
    const received: TabusMessage[] = [];
    t1.onMessage((m) => received.push(m));

    t1.send(msg());

    // Transport delivers to all listeners including the sender's own.
    // Deduplication is the caller's (Tabus) responsibility.
    expect(received).toHaveLength(1);

    t1.destroy();
  });

  it("isolates channels — messages on 'a' do not reach listeners on 'b'", () => {
    const ta = new MemoryTransport("a");
    const tb = new MemoryTransport("b");

    const received: TabusMessage[] = [];
    tb.onMessage((m) => received.push(m));

    ta.send(msg());

    expect(received).toHaveLength(0);

    ta.destroy();
    tb.destroy();
  });

  it("stops delivering after destroy()", () => {
    const t1 = new MemoryTransport("ch");
    const t2 = new MemoryTransport("ch");

    const received: TabusMessage[] = [];
    t2.onMessage((m) => received.push(m));
    t2.destroy();

    t1.send(msg());

    expect(received).toHaveLength(0);

    t1.destroy();
  });

  it("replaces the listener when onMessage is called twice", () => {
    const t1 = new MemoryTransport("ch");
    const t2 = new MemoryTransport("ch");

    const log: string[] = [];
    t2.onMessage(() => log.push("first"));
    t2.onMessage(() => log.push("second")); // replaces first

    t1.send(msg());

    expect(log).toEqual(["second"]);

    t1.destroy();
    t2.destroy();
  });

  it("warns once per channel when BroadcastChannel is unavailable", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Two instances on 'alpha' → one warn
    new MemoryTransport("alpha").destroy();
    new MemoryTransport("alpha").destroy();
    // One instance on 'beta' → one warn
    new MemoryTransport("beta").destroy();

    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it("includes the channel name in the warning message", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    new MemoryTransport("my-channel").destroy();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("my-channel"),
    );

    warnSpy.mockRestore();
  });
});
