# Getting Started

## What is tabus-js?

`tabus-js` is a type-safe cross-tab message bus for the browser.
It lets tabs on the same origin communicate instantly using the
native `BroadcastChannel` API — no server, no WebSockets, no polling.

## The problem

When a user signs out in one tab, other open tabs keep showing
sensitive data. `tabus-js` solves this by propagating events
across all tabs instantly.

## Quick start

```bash
npm install tabus-js
# or
pnpm add tabus-js
```

```ts
import { Tabus } from "tabus-js";

type MyEvents = {
  logout: { userId: number };
  ping: { ts: number };
};

const bus = new Tabus<MyEvents>("my-app");

bus.on("logout", ({ userId }) => {
  console.log("User logged out:", userId);
});

bus.emit("logout", { userId: 42 });

bus.destroy();
```

## How it works

1. Each `Tabus` instance opens a `BroadcastChannel` on the given channel name
2. `emit()` sends a message to all other tabs on the same channel
3. Other tabs receive the message and fire their registered handlers
4. The emitting tab does **not** receive its own events (no loops)
5. `tab:join` and `tab:leave` fire automatically on open/close
