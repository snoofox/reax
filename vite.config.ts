import { defineConfig } from "vite";

export default defineConfig({
  oxc: {
    jsx: { runtime: "classic", pragma: "h", pragmaFrag: "Fragment" },
    jsxInject: `import { h, Fragment } from "/lib/index.ts"`,
  },
  resolve: { alias: { reax: "/lib/index.ts" } },
});
