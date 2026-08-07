import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://RP02.github.io/inv
export default defineConfig({
  base: "/inv/",
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    outDir: "build",
  },
});
