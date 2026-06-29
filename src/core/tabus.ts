import { generateId } from "./generate-id";
import { MemoryTransport } from "../transport/memory.transport";
import { BroadcastTransport } from "../transport/broadcast.transport";
import type { ITransport } from "../transport/transport.interface";
import type { Handler, EventMap, TabusMessage, FullEventMap } from "./types";

export class Tabus<Events extends EventMap = EventMap> {
  /**
   * Unique identifier for this tab / instance.
   * Generated once per instance using `crypto.randomUUID()` or a manual fallback.
   *
   * @example
   * ```ts
   * const bus = new Tabus();
   * console.log(bus.tabId); // "3f2a…"
   * ```
   */
  readonly tabId: string;

  private readonly transport: ITransport;
  private readonly localHandlers = new Map<string, Set<Handler>>();
  private destroyed = false;
  private joinTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates a new Tabus instance on the given channel.
   *
   * Uses `BroadcastChannel` when available (cross-tab communication); falls
   * back to an in-process in-memory bus otherwise.
   *
   * **`tab:join` is emitted asynchronously** (via `setTimeout 0`) so handlers
   * can be registered on the instance before the event is broadcast.
   *
   * @param channelName - Shared channel name (default: `"tabus"`). All
   *   instances with the same channel name can communicate with each other.
   *
   * @example
   * ```ts
   * type MyEvents = { data: { value: number }; reset: void };
   * const bus = new Tabus<MyEvents>("my-app");
   * bus.on("tab:join", ({ tabId }) => console.log("peer joined:", tabId));
   * ```
   */
  constructor(channelName?: string) {
    this.tabId = generateId();
    const name = channelName ?? "tabus";

    this.transport = typeof BroadcastChannel !== "undefined" ? new BroadcastTransport(name) : new MemoryTransport(name);

    // Deduplication: ignore messages that originated from this instance.
    this.transport.onMessage((msg: TabusMessage) => {
      if (msg.tabId === this.tabId) return;
      this.dispatch(msg.event, msg.payload);
    });

    // Defer so callers can register tab:join handlers synchronously after
    // the constructor returns before the broadcast goes out.
    this.joinTimer = setTimeout(() => {
      this.joinTimer = null;
      if (!this.destroyed) {
        this.transport.send({
          tabId  : this.tabId,
          event  : "tab:join",
          payload: { tabId: this.tabId },
        });
      }
    }, 0);
  }

  /**
   * Subscribes to an event, including internal lifecycle events
   * `"tab:join"` and `"tab:leave"`.
   *
   * @param event - The event name to listen to.
   * @param handler - Callback invoked with the event payload when the event fires.
   * @returns `this` for chaining.
   *
   * @example
   * ```ts
   * bus
   *   .on("data", ({ value }) => console.log(value))
   *   .on("tab:join", ({ tabId }) => console.log("new peer:", tabId));
   * ```
   */
  on<K extends keyof FullEventMap<Events>>(
    event: K,
    handler: Handler<FullEventMap<Events>[K]>,
  ): this {
    if (this.destroyed) return this;

    const key = String(event);

    if (!this.localHandlers.has(key)) {
      this.localHandlers.set(key, new Set());
    }

    this.localHandlers.get(key)!.add(handler as Handler);
    return this;
  }

  /**
   * Unsubscribes a previously registered handler.
   *
   * @param event - The event name.
   * @param handler - The exact same handler reference passed to `on()`.
   * @returns `this` for chaining.
   *
   * @example
   * ```ts
   * const handler = (p: { value: number }) => console.log(p.value);
   * bus.on("data", handler);
   * // later:
   * bus.off("data", handler);
   * ```
   */
  off<K extends keyof FullEventMap<Events>>(
    event: K,
    handler: Handler<FullEventMap<Events>[K]>,
  ): this {
    this.localHandlers.get(String(event))?.delete(handler as Handler);
    return this;
  }

  /**
   * Broadcasts an event to **all other instances** on the same channel.
   *
   * **The emitting instance does NOT receive its own event.** If local handling
   * is needed, call the handler directly after emitting.
   *
   * @param event - A user-defined event name (internal events cannot be emitted).
   * @param payload - The value to broadcast.
   * @returns `this` for chaining.
   *
   * @example
   * ```ts
   * bus.emit("data", { value: 42 });
   * // other tabs receive { value: 42 }; this tab does not.
   * ```
   */
  emit<K extends keyof Events>(event: K, payload: Events[K]): this {
    if (this.destroyed) return this;
    this.transport.send({ tabId: this.tabId, event: String(event), payload });
    return this;
  }

  /**
   * Broadcasts `"tab:leave"`, closes the transport, and removes all handlers.
   * Safe to call multiple times — subsequent calls are no-ops.
   *
   * If the deferred `"tab:join"` has not yet fired (i.e., the instance is
   * destroyed within the same tick it was created), neither `"tab:join"` nor
   * `"tab:leave"` are sent to peers.
   *
   * @example
   * ```ts
   * window.addEventListener("beforeunload", () => bus.destroy());
   * ```
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.joinTimer !== null) {
      // tab:join hasn't fired yet — cancel it; peers don't know we existed,
      // so there is nothing to announce on departure either.
      clearTimeout(this.joinTimer);
      this.joinTimer = null;
    } else {
      // tab:join already fired — announce departure to peers.
      this.transport.send({
        tabId  : this.tabId,
        event  : "tab:leave",
        payload: { tabId: this.tabId },
      });
    }

    this.transport.destroy();
    this.localHandlers.clear();
  }

  /** Invokes all registered handlers for the given event with the payload. */
  private dispatch(event: string, payload: unknown): void {
    this.localHandlers.get(event)?.forEach((h) => h(payload));
  }
}
