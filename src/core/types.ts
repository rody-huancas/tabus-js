export type Handler<T = unknown> = (payload: T) => void;

export interface TabusOptions {
  /**
   * Minimum time in milliseconds between emitted messages.
   * When set, emit() calls that arrive faster than this interval
   * are discarded. Useful for high-frequency events like mousemove
   * or scroll to prevent flooding the main thread.
   *
   * @example
   * // Allow at most one message every 16ms (~60fps)
   * const bus = new Tabus('canvas', { throttle: 16 })
   */
  throttle?: number;
}

export type EventMap = Record<string, unknown>;

export interface TabusMessage<T = unknown> {
  tabId  : string;
  event  : string;
  payload: T;
}

export type InternalEvents = {
  "tab:join" : { tabId: string };
  "tab:leave": { tabId: string };
};

/** Merges user-defined events with internal lifecycle events. */
export type FullEventMap<T extends EventMap> = T & InternalEvents;
