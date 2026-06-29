export type Handler<T = unknown> = (payload: T) => void;

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
