import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { VarletImportResolver } from "@varlet/import-resolver";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VarletImportResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
