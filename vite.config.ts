import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(rootDir, "lib/index.ts"),
        "jsx-runtime": resolve(rootDir, "lib/jsx-runtime.ts"),
        "jsx-dev-runtime": resolve(rootDir, "lib/jsx-dev-runtime.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["rxjs", /^rxjs\/.*/],
    },
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
  },
});
