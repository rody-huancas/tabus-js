import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BroadcastTransport } from "../src/transport/broadcast.transport";
import type { TabusMessage } from "../src/core/types";

// minimal BroadcastChannel mock

class MockBroadcastChannel {
  static channels = new Map<string, Set<MockBroadcastChannel>>();
  private readonly listeners = new Set<(ev: { data: unknown }) => void>();

  constructor(private readonly name: string) {
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  addEventListener(_type: string, handler: (ev: { data: unknown }) => void) {
    this.listeners.add(handler);
  }

  postMessage(data: unknown) {
    MockBroadcastChannel.channels.get(this.name)?.forEach((ch) => {
      if (ch !== this) ch.listeners.forEach((l) => l({ data }));
    });
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }

  static reset() {
    this.channels.clear();
  }
}

// tests

describe("BroadcastTransport", () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    MockBroadcastChannel.reset();
  });

  it("delivers messages to other transport instances on the same channel", () => {
    const t1 = new BroadcastTransport("ch");
    const t2 = new BroadcastTransport("ch");

    const received: TabusMessage[] = [];
    t2.onMessage((msg) => received.push(msg));

    const msg: TabusMessage = { tabId: "t1", event: "hello", payload: 42 };
    t1.send(msg);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(msg);

    t1.destroy();
    t2.destroy();
  });

  it("does NOT deliver messages to the sender (native BroadcastChannel semantics)", () => {
    const t1 = new BroadcastTransport("ch");

    const received: TabusMessage[] = [];
    t1.onMessage((msg) => received.push(msg));

    t1.send({ tabId: "t1", event: "test", payload: null });

    expect(received).toHaveLength(0);

    t1.destroy();
  });

  it("isolates channels — messages on 'a' do not reach listeners on 'b'", () => {
    const ta = new BroadcastTransport("a");
    const tb = new BroadcastTransport("b");

    const received: TabusMessage[] = [];
    tb.onMessage((msg) => received.push(msg));

    ta.send({ tabId: "x", event: "ping", payload: null });

    expect(received).toHaveLength(0);

    ta.destroy();
    tb.destroy();
  });

  it("closes the underlying BroadcastChannel on destroy()", () => {
    const t1 = new BroadcastTransport("ch");
    const instance = [...MockBroadcastChannel.channels.get("ch")!][0];
    const closeSpy = vi.spyOn(instance, "close");

    t1.destroy();

    expect(closeSpy).toHaveBeenCalledOnce();
  });
});
