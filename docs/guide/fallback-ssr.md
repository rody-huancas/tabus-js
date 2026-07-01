# Fallback & SSR

## BroadcastChannel fallback

When `BroadcastChannel` is unavailable (old browsers, WebViews,
or server environments), `tabus-js` falls back to an in-memory
bus automatically.

- Events still work within the same tab/process
- A `console.warn` fires once per channel name
- No code changes needed — it's transparent

```ts
// Same API regardless of transport
const bus = new Tabus("my-app");
bus.on("event", handler); // works in both modes
```

## Next.js

Use the `'use client'` directive. Create the instance outside
the component to avoid re-creating it on every render:

```tsx
"use client";

import { useEffect } from "react";
import { Tabus } from "tabus-js";

const bus = new Tabus("my-app"); // outside component

export function MyComponent() {
  useEffect(() => {
    const handler = (data) => console.log(data);
    bus.on("event", handler);
    return () => bus.off("event", handler);
  }, []);
}
```

## Nuxt

```ts
// composables/useBus.ts
import { Tabus } from "tabus-js";

let bus: Tabus | null = null;

export const useBus = () => {
  if (import.meta.client && !bus) {
    bus = new Tabus("my-app");
  }
  
  return bus;
};
```
