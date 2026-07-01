# Installation

## Package managers

```bash
npm install tabus-js
pnpm add tabus-js
yarn add tabus-js
```

## CDN

No build step required:

```html
<script type="module">
  import { Tabus } from "https://cdn.jsdelivr.net/npm/tabus-js/dist/index.mjs";

  const bus = new Tabus("my-app");
  bus.on("ping", (data) => console.log(data));
</script>
```

## Browser support

| Browser | Minimum version |
| ------- | --------------- |
| Chrome  | 54+             |
| Firefox | 38+             |
| Safari  | 15.4+           |
| Edge    | 79+             |

## TypeScript

`tabus-js` ships with full TypeScript support out of the box.
No `@types/` package needed.

```ts
import { Tabus, type TabusOptions } from "tabus-js";
```
