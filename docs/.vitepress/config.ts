import { defineConfig } from "vitepress";

export default defineConfig({
  title      : "tabus-js",
  description: "Type-safe cross-tab message bus for the browser",
  base       : "/tabus/",
  head       : [["link", { rel: "icon", href: "/tabus/logo.png" }]],
  themeConfig: {
    logo     : "/logo.png",
    siteTitle: false,
    nav      : [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/reference" },
      { text: "Examples", link: "/examples/use-cases" },
    ],
    sidebar: {
      "/guide/": [
        {
          text : "Guide",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Fallback & SSR", link: "/guide/fallback-ssr" },
          ],
        },
      ],
      "/api/": [
        {
          text : "API",
          items: [{ text: "Reference", link: "/api/reference" }],
        },
      ],
      "/examples/": [
        {
          text : "Examples",
          items: [
            { text: "React", link: "/examples/react" },
            { text: "Vue", link: "/examples/vue" },
            { text: "Vanilla JS", link: "/examples/vanilla" },
            { text: "Next.js", link: "/examples/nextjs" },
            { text: "Use Cases", link: "/examples/use-cases" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/rody-huancas/tabus" },
      { icon: "npm", link: "https://www.npmjs.com/package/tabus-js" },
    ],
    footer: {
      message  : "Released under the MIT License.",
      copyright: "Copyright © 2026–present Rody Huancas",
    },
  },
});
