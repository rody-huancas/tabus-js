<div align="center">
  <img src="./public/tabus-logo.png" alt="tabus" width="120" />
</div>

# tabus

> Type-safe cross-tab message bus for the browser, built on the native `BroadcastChannel` API.

[![npm](https://img.shields.io/npm/v/tabus)](https://www.npmjs.com/package/tabus)
[![license](https://img.shields.io/npm/l/tabus)](./LICENSE)
[![types](https://img.shields.io/npm/types/tabus)](./src/core/types.ts)

## Why

When a user signs out in one tab, other open tabs keep showing sensitive data.  
`tabus` solves this by letting tabs broadcast events to each other instantly — no server, no WebSockets, no polling.

## Install

```bash
npm install tabus
# or
pnpm add tabus
```

## Quick start

```ts
import { Tabus } from "tabus";

type MyEvents = {
  logout: { userId: number };
  ping: { ts: number };
};

const bus = new Tabus<MyEvents>("my-app");

// Listen for events from other tabs
bus.on("logout", ({ userId }) => {
  console.log("User logged out:", userId);
  redirectToLogin();
});

// Broadcast to all other tabs
bus.emit("logout", { userId: 42 });

// Clean up
bus.destroy();
```

## API

### `new Tabus<Events>(channelName?)`

Creates a new instance. All instances with the same `channelName` share a channel.  
Defaults to `'tabus'` if no name is provided.

### `bus.on(event, handler)`

Subscribes to an event. Returns `this` for chaining.  
Also accepts internal events: `tab:join` and `tab:leave`.

### `bus.emit(event, payload)`

Broadcasts an event to all other tabs on the same channel.  
The emitting tab does **not** receive its own events.

### `bus.off(event, handler)`

Removes a previously registered handler. Returns `this` for chaining.

### `bus.destroy()`

Closes the channel, emits `tab:leave`, and removes all handlers. Safe to call multiple times.

### `bus.tabId`

A unique UUID identifying this tab instance. Read-only.

## Lifecycle events

```ts
bus.on("tab:join", ({ tabId }) => console.log("Tab joined:", tabId));
bus.on("tab:leave", ({ tabId }) => console.log("Tab left:", tabId));
```

These are emitted automatically — you cannot emit them manually.

## Fallback

If `BroadcastChannel` is not available (old browsers, some WebViews), `tabus` falls back to an in-memory bus automatically. Events will still work within the same tab. A `console.warn` is emitted once per channel to notify you.

## Browser support

| Browser | Version |
| ------- | ------- |
| Chrome  | 54+     |
| Firefox | 38+     |
| Safari  | 15.4+   |
| Edge    | 79+     |

## License

MIT © [Rody Huancas](https://github.com/rody-huancas)
