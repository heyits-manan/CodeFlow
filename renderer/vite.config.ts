import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: {
      overlay: false, // Disable error overlay that can cause reloads
    },
    watch: {
      // More specific file watching
      ignored: ["**/node_modules/**", "**/dist/**"],
    },
  },
  // Better optimization for development
  optimizeDeps: {
    include: ["react", "react-dom", "@monaco-editor/react"],
  },
});
