import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const entry = fileURLToPath(new URL("./app.html", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      // `index.html` is the built, standalone app (served by GitHub Pages).
      // During development, send the root URL to the Vite entry instead.
      name: "serve-app-entry-at-root",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url === "/index.html") req.url = "/app.html";
          next();
        });
      },
    },
  ],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: entry,
    },
  },
  server: {
    port: 5173,
  },
});
