import { defineConfig } from "vite";

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic", importSource: "reax" },
  },
  resolve: {
    alias: {
      "reax/jsx-dev-runtime": "/lib/jsx-dev-runtime.ts",
      "reax/jsx-runtime": "/lib/jsx-runtime.ts",
      reax: "/lib/index.ts",
    },
  },
});
