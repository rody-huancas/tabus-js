# API Reference

## Constructor

```ts
new Tabus<Events>(channelName?: string, options?: TabusOptions)
```

| Parameter          | Type     | Default   | Description          |
| ------------------ | -------- | --------- | -------------------- |
| `channelName`      | `string` | `'tabus'` | Shared channel name  |
| `options.throttle` | `number` | `0`       | Min ms between emits |

## Methods

### `on(event, handler)`

Subscribe to an event.

```ts
bus.on('logout', ({ userId }) => { ... })
bus.on('tab:join', ({ tabId }) => { ... })
```

Returns `this` for chaining.

### `emit(event, payload)`

Broadcast to all other tabs. The emitting tab does **not**
receive its own event.

```ts
bus.emit("logout", { userId: 42 });
```

Returns `this` for chaining.

### `off(event, handler)`

Remove a handler. Pass the exact same reference used in `on()`.

```ts
bus.off("logout", handler);
```

Returns `this` for chaining.

### `destroy()`

Close the channel, emit `tab:leave`, clear all handlers.
Safe to call multiple times.

```ts
bus.destroy();
```

## Properties

### `tabId`

Unique UUID for this tab instance. Read-only.

```ts
console.log(bus.tabId); // "3f2a1b..."
```

## Lifecycle events

| Event       | Payload             | When                              |
| ----------- | ------------------- | --------------------------------- |
| `tab:join`  | `{ tabId: string }` | A new tab opens                   |
| `tab:leave` | `{ tabId: string }` | A tab closes or calls `destroy()` |

These are **read-only** — you can listen with `on()` but cannot
emit them with `emit()`. TypeScript enforces this.

## Types

```ts
import type { TabusOptions, EventMap } from "tabus-js";

type MyEvents = {
  logout: { userId: number };
  ping: { ts: number };
};

const bus = new Tabus<MyEvents>("my-app");
```
