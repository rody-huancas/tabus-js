import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Tabus } from "../src/index";

// helpers

type TestEvents = {
  greet: { message: string };
  count: number;
};

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

/*
  - in-memory fallback

  Force the fallback path even on Node 18+ (where BroadcastChannel exists but
  delivers messages asynchronously, breaking synchronous assertions).
  Fake timers are always active so tab:join / tab:leave timing is predictable.
*/

describe("Tabus – in-memory fallback", () => {
  let a: Tabus<TestEvents>;
  let b: Tabus<TestEvents>;

  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    a?.destroy();
    b?.destroy();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // identity

  it("generates a unique tabId per instance", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");
    expect(a.tabId).not.toBe(b.tabId);
    expect(a.tabId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  // emit / on / off

  it("delivers events to other instances on the same channel", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const received: { message: string }[] = [];
    b.on("greet", (p) => received.push(p));
    a.emit("greet", { message: "hello" });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ message: "hello" });
  });

  it("emitter does NOT receive its own events", () => {
    a = new Tabus("ch");
    let calls = 0;
    a.on("count", () => calls++);
    a.emit("count", 1);
    expect(calls).toBe(0);
  });

  it("off() removes a specific handler", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const received: number[] = [];
    const handler = (p: number) => received.push(p);
    b.on("count", handler);
    a.emit("count", 1);
    b.off("count", handler);
    a.emit("count", 2);

    expect(received).toEqual([1]);
  });

  it("multiple handlers on the same event all fire", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const log: string[] = [];
    b.on("greet", () => log.push("h1"));
    b.on("greet", () => log.push("h2"));
    a.emit("greet", { message: "hi" });

    expect(log).toEqual(["h1", "h2"]);
  });

  // tab:join / tab:leave

  it("tab:join is deferred — not delivered before the next tick", () => {
    a = new Tabus("ch");
    const joins: { tabId: string }[] = [];
    a.on("tab:join", (p) => joins.push(p));

    b = new Tabus("ch");
    // Still in the same tick — no timers have fired yet.
    expect(joins).toHaveLength(0);

    vi.runAllTimers(); // flush both joinTimers
    // Only b's tab:join reaches a (a's own is deduped).
    expect(joins).toHaveLength(1);
    expect(joins[0].tabId).toBe(b.tabId);
  });

  it("receives tab:leave when a peer is destroyed after joining", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const leaves: { tabId: string }[] = [];
    a.on("tab:leave", (p) => leaves.push(p));

    vi.runAllTimers(); // fire both joinTimers so joinTimer === null
    b.destroy();      // joinTimer is null → sends tab:leave

    expect(leaves).toHaveLength(1);
    expect(leaves[0].tabId).toBe(b.tabId);
  });

  it("cancels tab:join and skips tab:leave when destroyed before the timer fires", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const events: string[] = [];
    a.on("tab:join", ({ tabId }) => events.push(`join:${tabId}`));
    a.on("tab:leave", ({ tabId }) => events.push(`leave:${tabId}`));

    // Destroy b before its joinTimer fires.
    b.destroy();

    vi.runAllTimers(); // a's joinTimer fires; b's was cancelled

    // a's own tab:join is deduped; b never announced itself, so no events.
    expect(events).toHaveLength(0);
  });

  // lifecycle

  it("stops delivering events after destroy()", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));
    b.destroy();
    a.emit("count", 99);

    expect(received).toHaveLength(0);
  });

  it("destroy() is idempotent", () => {
    a = new Tabus("ch");
    expect(() => {
      a.destroy();
      a.destroy();
    }).not.toThrow();
  });

  it("emit() and on() are no-ops after destroy()", () => {
    a = new Tabus("ch");
    b = new Tabus("ch");

    let callCount = 0;
    a.destroy();
    a.on("count", () => callCount++); // no-op
    b.emit("count", 1);               // a won't receive
    a.emit("count", 2);               // no-op

    expect(callCount).toBe(0);
  });

  // channel isolation

  it("instances on different channels are isolated", () => {
    a = new Tabus("channel-a");
    b = new Tabus("channel-b");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));
    a.emit("count", 1);

    expect(received).toHaveLength(0);
  });

  // chaining

  it("on() is chainable", () => {
    a = new Tabus("ch");
    expect(a.on("count", () => {}).on("greet", () => {})).toBe(a);
  });

  it("emit() is chainable", () => {
    a = new Tabus("ch");
    expect(a.emit("count", 1).emit("count", 2)).toBe(a);
  });
});

// BroadcastChannel mode

describe("Tabus – BroadcastChannel mode", () => {
  let a: Tabus<TestEvents>;
  let b: Tabus<TestEvents>;

  beforeEach(() => {
    MockBroadcastChannel.reset();
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    vi.useFakeTimers();
  });

  afterEach(() => {
    a?.destroy();
    b?.destroy();
    vi.unstubAllGlobals();
    MockBroadcastChannel.reset();
    vi.useRealTimers();
  });

  it("delivers events to other instances via BroadcastChannel", () => {
    a = new Tabus("bc");
    b = new Tabus("bc");

    const received: { message: string }[] = [];
    b.on("greet", (p) => received.push(p));
    a.emit("greet", { message: "bc-hello" });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ message: "bc-hello" });
  });

  it("emitter does not receive own events via BroadcastChannel", () => {
    a = new Tabus("bc");
    let calls = 0;
    a.on("count", () => calls++);
    a.emit("count", 7);
    expect(calls).toBe(0);
  });

  it("fires tab:join and tab:leave to peers across instances", () => {
    a = new Tabus("bc");
    const events: string[] = [];
    a.on("tab:join", ({ tabId }) => events.push(`join:${tabId}`));
    a.on("tab:leave", ({ tabId }) => events.push(`leave:${tabId}`));

    b = new Tabus("bc");
    const bId = b.tabId;

    vi.runAllTimers(); // fire both joinTimers
    b.destroy();       // joinTimer is null → sends tab:leave

    expect(events).toContain(`join:${bId}`);
    expect(events).toContain(`leave:${bId}`);
  });

  it("closes the BroadcastChannel on destroy()", () => {
    a = new Tabus("bc");
    vi.runAllTimers(); // fire joinTimer so destroy() sends tab:leave (and then close)

    const instance = [...MockBroadcastChannel.channels.get("bc")!][0];
    const closeSpy = vi.spyOn(instance, "close");

    a.destroy();

    expect(closeSpy).toHaveBeenCalledOnce();
  });
});

// throttle option

describe("Tabus – throttle option", () => {
  let a: Tabus<TestEvents>;
  let b: Tabus<TestEvents>;

  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    a?.destroy();
    b?.destroy();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("emits the first message immediately", () => {
    a = new Tabus<TestEvents>("ch", { throttle: 100 });
    b = new Tabus<TestEvents>("ch");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));
    a.emit("count", 1);

    expect(received).toEqual([1]);
  });

  it("discards messages emitted within the throttle window", () => {
    a = new Tabus<TestEvents>("ch", { throttle: 100 });
    b = new Tabus<TestEvents>("ch");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));

    a.emit("count", 1);
    a.emit("count", 2); // within throttle window — discarded

    expect(received).toEqual([1]);
  });

  it("allows a second message after the throttle window", () => {
    a = new Tabus<TestEvents>("ch", { throttle: 100 });
    b = new Tabus<TestEvents>("ch");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));

    a.emit("count", 1);
    vi.advanceTimersByTime(101); // past the throttle window
    a.emit("count", 2);

    expect(received).toEqual([1, 2]);
  });

  it("does not throttle when option is not set", () => {
    a = new Tabus<TestEvents>("ch");
    b = new Tabus<TestEvents>("ch");

    const received: number[] = [];
    b.on("count", (p) => received.push(p));

    a.emit("count", 1);
    a.emit("count", 2);
    a.emit("count", 3);

    expect(received).toEqual([1, 2, 3]);
  });
});
