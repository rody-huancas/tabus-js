# Vue

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Tabus } from "tabus-js";

const bus = new Tabus("my-app");

const handler = ({ userId }: { userId: number }) => {
  redirectToLogin();
};

onMounted(() => bus.on("logout", handler));
onUnmounted(() => bus.off("logout", handler));
</script>

<template>
  <button @click="bus.emit('logout', { userId: 42 })">Logout</button>
</template>
```
