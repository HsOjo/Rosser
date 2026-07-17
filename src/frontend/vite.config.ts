import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { readFileSync } from "fs";

const version = readFileSync(resolve(__dirname, "../../VERSION"), "utf-8").trim();

export default defineConfig(async () => ({
  plugins: [vue()],
  define: {
    __ROSSER_VERSION__: JSON.stringify(version),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
