import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { readFileSync } from "fs";

const version = readFileSync(resolve(__dirname, "../../VERSION"), "utf-8").trim();

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __ROSSER_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: false,
    exclude: ["e2e/**/*", "node_modules/**/*", "dist/**/*"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
