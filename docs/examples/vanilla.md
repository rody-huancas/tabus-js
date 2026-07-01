# Vanilla JS

```js
import { Tabus } from "tabus-js";

const bus = new Tabus("my-app");

bus.on("notification", ({ message }) => {
  alert(message);
});

document.querySelector("#btn").addEventListener("click", () => {
  bus.emit("notification", { message: "Hello from this tab!" });
});

// Lifecycle
bus.on("tab:join", ({ tabId }) => console.log("joined:", tabId));
bus.on("tab:leave", ({ tabId }) => console.log("left:", tabId));
```
