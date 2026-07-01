# Real-world Use Cases

## Sync logout across tabs

The most common use case. When the user signs out in one tab,
all other tabs redirect to login instantly.

```ts
import { Tabus } from "tabus-js";

type AuthEvents = {
  "auth:logout": { userId: number };
  "auth:session-expired": { reason: string };
};

const auth = new Tabus<AuthEvents>("auth");

// Listen in every tab
auth.on("auth:logout", () => {
  clearLocalStorage();
  window.location.href = "/login";
});

auth.on("auth:session-expired", ({ reason }) => {
  alert(`Session expired: ${reason}`);
  window.location.href = "/login";
});

// Trigger from your logout button
function logout(userId: number) {
  performLogoutRequest(userId).then(() => {
    auth.emit("auth:logout", { userId });
  });
}

// Trigger from your Axios 401 interceptor
axios.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    auth.emit("auth:session-expired", { reason: "Token expired" });
  }
  return Promise.reject(error);
});
```

## Sync cart across tabs

User adds a product in one tab — all other tabs update instantly.

```ts
import { Tabus } from "tabus-js";

type CartEvents = {
  "cart:item-added": { productId: string; qty: number };
  "cart:item-removed": { productId: string };
  "cart:cleared": Record<string, never>;
};

const cart = new Tabus<CartEvents>("cart");

cart.on("cart:item-added", ({ productId, qty }) => {
  updateCartUI(productId, qty);
});

cart.on("cart:cleared", () => {
  resetCartUI();
});

function addToCart(productId: string, qty: number) {
  cart.emit("cart:item-added", { productId, qty });
}
```

## Invalidate TanStack Query cache

Combined with TanStack Query: one tab tells the others
that data changed, each tab refetches automatically.

```ts
import { Tabus } from "tabus-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type SyncEvents = {
  "patients:updated": { patientId: number };
  "sales:new": { saleId: number };
};

const bus = new Tabus<SyncEvents>("my-app");

// In your React component or layout
function useTabSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onPatientUpdated = ({ patientId }: { patientId: number }) => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
    };

    const onNewSale = () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    };

    bus.on("patients:updated", onPatientUpdated);
    bus.on("sales:new", onNewSale);

    return () => {
      bus.off("patients:updated", onPatientUpdated);
      bus.off("sales:new", onNewSale);
    };
  }, [queryClient]);
}

// After mutating a patient
function updatePatient(patientId: number, data: PatientData) {
  await api.patch(`/patients/${patientId}`, data);
  bus.emit("patients:updated", { patientId });
}
```

## Sync UI theme across tabs

User switches to dark mode — all tabs update instantly.

```ts
import { Tabus } from "tabus-js";

type UIEvents = {
  "ui:theme-changed": { theme: "light" | "dark" };
};

const ui = new Tabus<UIEvents>("ui");

ui.on("ui:theme-changed", ({ theme }) => {
  document.documentElement.setAttribute("data-theme", theme);
});

function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  ui.emit("ui:theme-changed", { theme });
}
```

## High-frequency events with throttle

Sync cursor position across tabs without flooding the main thread.

```ts
import { Tabus } from "tabus-js";

type CursorEvents = {
  "cursor:moved": { x: number; y: number };
};

// Throttle to max 1 message every 16ms (~60fps)
const bus = new Tabus<CursorEvents>("canvas", { throttle: 16 });

bus.on("cursor:moved", ({ x, y }) => {
  renderRemoteCursor(x, y);
});

window.addEventListener("mousemove", (e) => {
  bus.emit("cursor:moved", { x: e.clientX, y: e.clientY });
});
```
