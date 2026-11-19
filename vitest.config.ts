import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "happy-dom",
  },
  oxc: {
    jsx: { runtime: "automatic", importSource: "reax" },
  },
  resolve: {
    alias: {
      "reax/jsx-dev-runtime": resolve(rootDir, "lib/jsx-dev-runtime.ts"),
      "reax/jsx-runtime": resolve(rootDir, "lib/jsx-runtime.ts"),
      reax: resolve(rootDir, "lib/index.ts"),
    },
  },
});
