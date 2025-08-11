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
      port: 24678, // Use a specific port for HMR to avoid conflicts
    },
    watch: {
      // More specific file watching
      ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      // Reduce polling to minimize file system events
      usePolling: false,
      interval: 1000,
    },
    // Add stability options
    strictPort: true, // Don't try other ports if 5173 is busy
    host: "localhost",
  },
  // Better optimization for development
  optimizeDeps: {
    include: ["react", "react-dom", "@monaco-editor/react"],
  },
});
