import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Foundatio FetchClient",
  description:
    "A tiny, typed wrapper around fetch with caching, middleware, rate limiting, and great DX.",
  base: "/",
  ignoreDeadLinks: true,
  head: [
    ["link", {
      rel: "icon",
      href:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png",
      type: "image/png",
    }],
    ["meta", { name: "theme-color", content: "#3c8772" }],
  ],
  themeConfig: {
    logo: {
      light:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/master/media/foundatio.svg",
      dark:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/master/media/foundatio-dark-bg.svg",
    },
    siteTitle: "FetchClient",
    nav: [
      { text: "Guide", link: "/guide/what-is-fetchclient" },
      { text: "GitHub", link: "https://github.com/FoundatioFx/FetchClient" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            {
              text: "What is FetchClient?",
              link: "/guide/what-is-fetchclient",
            },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Features", link: "/guide/features" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/FoundatioFx/FetchClient" },
      { icon: "discord", link: "https://discord.gg/6HxgFCx" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Foundatio",
    },
    editLink: {
      pattern:
        "https://github.com/FoundatioFx/FetchClient/edit/main/docs/:path",
    },
    search: {
      provider: "local",
    },
  },
  markdown: {
    lineNumbers: false,
  },
});
