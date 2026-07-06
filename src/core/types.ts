export type Handler<T = unknown> = (payload: T) => void;

export interface TabusOptions {
  /**
   * Minimum time in milliseconds between emitted messages.
   * When set, emit() calls that arrive faster than this interval
   * are throttled using a leading + trailing edge strategy:
   * the first call fires immediately, subsequent calls within
   * the window are held, and the last one fires when the window expires.
   *
   * @example
   * const bus = new Tabus('canvas', { throttle: 16 })
   */
  throttle?: number;

  /**
   * When true (default), emits the last pending message after
   * the throttle window expires (trailing edge).
   * When false, only the leading edge fires and intermediate
   * messages are silently discarded.
   *
   * Only relevant when `throttle` is set.
   *
   * @default true
   */
  trailing?: boolean;
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
