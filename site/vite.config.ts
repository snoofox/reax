import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const siteDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(siteDir, "..");

export default defineConfig({
  plugins: [tailwindcss()],
  root: siteDir,
  base: "./",
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@snoofox/reax",
  },
  resolve: {
    alias: {
      "@snoofox/reax/jsx-dev-runtime": resolve(rootDir, "lib/jsx-dev-runtime.ts"),
      "@snoofox/reax/jsx-runtime": resolve(rootDir, "lib/jsx-runtime.ts"),
      "@snoofox/reax": resolve(rootDir, "lib/index.ts"),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [rootDir],
    },
  },
  build: {
    outDir: resolve(siteDir, "dist"),
    emptyOutDir: true,
  },
});
