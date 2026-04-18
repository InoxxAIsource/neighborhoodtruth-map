import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "PlaceLabels",
        short_name: "PlaceLabels",
        description: "Crowd-sourced global neighborhood map",
        theme_color: "#0d9488",
        background_color: "#ffffff",
        display: "standalone",
        start_url: basePath,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }: { url: URL; request: Request }) =>
              url.pathname.startsWith("/api/labels") && request.method === "GET",
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url, request }: { url: URL; request: Request }) =>
              url.pathname.startsWith("/api/chat") && request.method === "GET",
            handler: "NetworkOnly",
          },
        ],
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) return "leaflet-vendor";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "react-vendor";
          if (id.includes("node_modules/@tanstack")) return "query";
          if (id.includes("node_modules/@radix-ui")) return "radix-vendor";
          if (id.includes("node_modules/lucide-react")) return "icons";
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      [`${basePath}api`]: {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${basePath.replace(/\//g, "\\/")}api`), "/api"),
      },
      "/sitemap.xml": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "^/[a-z-]+(?:/[a-z-]+)?/?$": {
        target: "http://localhost:8080",
        changeOrigin: true,
        bypass: (req) => {
          const url = req.url ?? "";
          if (/\.[a-z]{2,4}$/i.test(url)) return null;
          const spaOnlyPrefixes = [
            "/compare/",
            "/map",
            "/about",
            "/how-it-works",
            "/bangalore/it-hub-areas",
            "/pune/student-friendly-areas",
            "/delhi/family-friendly-areas",
            "/mumbai/safe-areas-for-women",
          ];
          if (spaOnlyPrefixes.some((p) => url === p || url.startsWith(p))) return null;
          if (!url.match(/^\/[a-z-]+(?:\/[a-z-]+)?(?:\/)?$/)) return null;
          return undefined;
        },
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
