import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pagesBase = "/RetailPulse-Zidio/";

export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? pagesBase : "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf("node_modules") === -1) return;
          if (id.indexOf("framer-motion") !== -1) return "motion-stack";
          if (id.indexOf("@remotion") !== -1 || id.indexOf("\\remotion\\") !== -1 || id.indexOf("/remotion/") !== -1) return "remotion-stack";
          if (id.indexOf("\\gsap\\") !== -1 || id.indexOf("/gsap/") !== -1) return "gsap-stack";
          if (id.indexOf("\\react\\") !== -1 || id.indexOf("/react/") !== -1 || id.indexOf("react-dom") !== -1) return "react-stack";
        },
      },
    },
  },
}));
