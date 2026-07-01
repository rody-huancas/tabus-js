---
layout: home

hero:
  name: tabus-js
  text: Cross-tab messaging, done right.
  tagline: Type-safe message bus for the browser. Built on BroadcastChannel. Zero dependencies.
  image:
    src: /logo.png
    alt: tabus-js
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/rody-huancas/tabus

features:
  - icon: 📡
    title: BroadcastChannel Native
    details: Uses the native browser API — no localStorage hacks, no polling, no server needed.
  - icon: 🔒
    title: Type-safe Events
    details: Generic Tabus<Events> gives you full TypeScript inference per event. No more any payloads.
  - icon: 🔄
    title: Lifecycle Events
    details: tab:join and tab:leave fire automatically when tabs open and close. No extra setup.
  - icon: 🛡️
    title: Fallback & SSR Safe
    details: Falls back to in-memory bus when BroadcastChannel is unavailable. Works in Next.js and Nuxt.
  - icon: ⚡
    title: Throttle Built-in
    details: Pass throttle option to limit emit frequency for high-rate events like mousemove or scroll.
  - icon: 🪶
    title: Zero Dependencies
    details: 8.8 KB packed. No runtime dependencies. Tree-shakeable. CJS + ESM + types included.
---
