import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "client"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "client/dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
