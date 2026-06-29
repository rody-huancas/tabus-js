# tabus-js

<div align="center">
  <img src="./public/tabus-logo.png" alt="tabus-js" width="250" />
</div>

> Type-safe cross-tab message bus for the browser, built on the native `BroadcastChannel` API.

[![npm](https://img.shields.io/npm/v/tabus-js)](https://www.npmjs.com/package/tabus-js)
[![license](https://img.shields.io/npm/l/tabus-js)](./LICENSE)
[![types](https://img.shields.io/npm/types/tabus-js)](./src/core/types.ts)

## Why

When a user signs out in one tab, other open tabs keep showing sensitive data.  
`tabus-js` solves this by letting tabs broadcast events to each other instantly — no server, no WebSockets, no polling.

## Install

```bash
npm install tabus-js
# or
pnpm add tabus-js
```

## Framework compatibility

`tabus-js` is framework-agnostic. It works in any environment that runs JavaScript in the browser.

| Environment           | Supported   |
| --------------------- | ----------- |
| Vanilla JS            | ✅          |
| React                 | ✅          |
| Vue                   | ✅          |
| Angular               | ✅          |
| Svelte                | ✅          |
| Next.js (client only) | ✅          |
| Nuxt (client only)    | ✅          |
| Node.js / SSR         | ⚠️ fallback |

> **SSR note:** `BroadcastChannel` is a browser API — it does not exist on the server. In SSR environments (Next.js, Nuxt, SvelteKit), create the `Tabus` instance only on the client side. If `BroadcastChannel` is unavailable, `tabus-js` falls back to an in-memory bus automatically and emits a `console.warn`.

## Quick start

```ts
import { Tabus } from "tabus-js";

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

## Examples

### Vanilla JS

```js
import { Tabus } from "tabus-js";

const bus = new Tabus("my-app");

bus.on("notification", ({ message }) => {
  alert(message);
});

document.querySelector("#btn").addEventListener("click", () => {
  bus.emit("notification", { message: "Hello from this tab!" });
});
```

### React

```tsx
import { useEffect } from "react";
import { Tabus } from "tabus-js";

type AppEvents = {
  logout: { userId: number };
};

const bus = new Tabus<AppEvents>("my-app");

function App() {
  useEffect(() => {
    const handler = ({ userId }: { userId: number }) => {
      console.log("Logged out:", userId);
      redirectToLogin();
    };

    bus.on("logout", handler);
    return () => bus.off("logout", handler);
  }, []);

  const handleLogout = () => {
    bus.emit("logout", { userId: 42 });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Vue

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Tabus } from "tabus-js";

type AppEvents = {
  logout: { userId: number };
};

const bus = new Tabus<AppEvents>("my-app");

const handler = ({ userId }: { userId: number }) => {
  console.log("Logged out:", userId);
  redirectToLogin();
};

onMounted(() => bus.on("logout", handler));
onUnmounted(() => bus.off("logout", handler));

const handleLogout = () => bus.emit("logout", { userId: 42 });
</script>

<template>
  <button @click="handleLogout">Logout</button>
</template>
```

### Next.js (client only)

```tsx
"use client";

import { useEffect } from "react";
import { Tabus } from "tabus-js";

type AppEvents = {
  logout: { userId: number };
};

// Create outside the component to share across renders
const bus = new Tabus<AppEvents>("my-app");

export function LogoutButton() {
  useEffect(() => {
    const handler = ({ userId }: { userId: number }) => {
      redirectToLogin();
    };

    bus.on("logout", handler);
    return () => bus.off("logout", handler);
  }, []);

  return (
    <button onClick={() => bus.emit("logout", { userId: 42 })}>Logout</button>
  );
}
```

### Real-world: sync logout across tabs

```ts
import { Tabus } from "tabus-js";

type AuthEvents = {
  logout: { userId: number };
  sessionExpired: { reason: string };
};

const auth = new Tabus<AuthEvents>("auth");

// In your auth service
auth.on("logout", () => {
  clearLocalStorage();
  redirectToLogin();
});

auth.on("sessionExpired", ({ reason }) => {
  showToast(`Session expired: ${reason}`);
  redirectToLogin();
});

// When the user clicks logout
function logout(userId: number) {
  auth.emit("logout", { userId });
}
```

### Real-world: sync cart across tabs

```ts
import { Tabus } from "tabus-js";

type CartEvents = {
  itemAdded: { productId: string; qty: number };
  itemRemoved: { productId: string };
  cleared: Record<string, never>;
};

const cart = new Tabus<CartEvents>("cart");

cart.on("itemAdded", ({ productId, qty }) => {
  updateCartUI(productId, qty);
});

cart.on("cleared", () => {
  resetCartUI();
});

// When user adds an item
function addToCart(productId: string, qty: number) {
  cart.emit("itemAdded", { productId, qty });
}
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

If `BroadcastChannel` is not available (old browsers, some WebViews, SSR), `tabus-js` falls back to an in-memory bus automatically. Events will still work within the same tab. A `console.warn` is emitted once per channel to notify you.

## Browser support

| Browser | Version |
| ------- | ------- |
| Chrome  | 54+     |
| Firefox | 38+     |
| Safari  | 15.4+   |
| Edge    | 79+     |

## License

MIT © [Rody Huancas](https://github.com/rody-huancas)
