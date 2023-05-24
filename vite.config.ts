import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from "url";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url))},
      {find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js'},
    ]
  },
  plugins: [vue()],
})
