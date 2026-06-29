import type { ITransport } from "./transport.interface";
import type { TabusMessage } from "../core/types";

// Module-level registries shared across all MemoryTransport instances.
const channels = new Map<string, Set<(msg: TabusMessage) => void>>();
// Tracks which channels have already been warned, so the warning fires once per channel.
const warnedChannels = new Set<string>();

/**
 * In-process transport used when `BroadcastChannel` is unavailable.
 * All instances sharing the same `channelName` communicate via a shared Set
 * of listeners. Unlike `BroadcastTransport`, the sender's own listener IS
 * called by `send()` — deduplication is the responsibility of the caller
 * (i.e. `Tabus`).
 */
export class MemoryTransport implements ITransport {
  private readonly channelName: string;
  private listener: ((msg: TabusMessage) => void) | null = null;

  constructor(channelName: string) {
    this.channelName = channelName;

    if (!channels.has(channelName)) {
      channels.set(channelName, new Set());
    }

    if (!warnedChannels.has(channelName)) {
      console.warn(
        `[tabus] BroadcastChannel is not available. Falling back to in-memory bus (channel: "${channelName}").`,
      );
      warnedChannels.add(channelName);
    }
  }

  send(msg: TabusMessage): void {
    channels.get(this.channelName)?.forEach((l) => l(msg));
  }

  onMessage(listener: (msg: TabusMessage) => void): void {
    // Remove any previously registered listener before swapping in the new one.
    if (this.listener) {
      channels.get(this.channelName)?.delete(this.listener);
    }

    this.listener = listener;
    channels.get(this.channelName)?.add(listener);
  }

  destroy(): void {
    if (this.listener) {
      channels.get(this.channelName)?.delete(this.listener);
      this.listener = null;
    }
  }
}

/**
 * Resets all module-level state.
 * @internal Only for use in unit tests.
 */
export function __resetMemoryBus(): void {
  channels.clear();
  warnedChannels.clear();
}
