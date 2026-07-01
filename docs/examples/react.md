# React

## Basic usage

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

## Custom hook

```tsx
import { useEffect } from "react";
import { Tabus } from "tabus-js";

const bus = new Tabus("my-app");

function useTabEvent<K extends string>(event: K, handler: (payload: any) => void) {
  useEffect(() => {
    bus.on(event as any, handler);
    return () => bus.off(event as any, handler);
  }, [event, handler]);
}
```
