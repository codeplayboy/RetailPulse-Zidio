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
}));
