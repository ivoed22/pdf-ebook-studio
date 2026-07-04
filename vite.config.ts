import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base is '/pdf-ebook-studio/' in production builds for GitHub Pages hosting.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/pdf-ebook-studio/" : "/",
  plugins: [react(), tailwindcss()],
}));
