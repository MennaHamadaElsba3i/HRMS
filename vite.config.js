import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "https://workwise-production-3941.up.railway.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
