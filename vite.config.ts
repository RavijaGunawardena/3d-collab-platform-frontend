import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Path aliases for absolute imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: true, // Open browser automatically
    cors: true, // Enable CORS
    proxy: {
      // Proxy API requests to backend during development
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket connections
      "/socket.io": {
        target: process.env.VITE_SOCKET_URL || "http://localhost:5000",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  },

  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true, // Generate sourcemaps for debugging
    minify: "esbuild", // Fast minification
    target: "es2020", // Modern browsers
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk for React and related
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Three.js and 3D libraries
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          // UI components
          "ui-vendor": ["zustand", "axios", "socket.io-client"],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB
  },

  // Optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "axios",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "socket.io-client",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },

  // Preview server configuration (for production preview)
  preview: {
    port: 3000,
    host: true,
    open: true,
  },

  // Environment variables prefix
  envPrefix: "VITE_",

  // Enable JSON imports
  json: {
    stringify: false,
  },

  // CSS configuration
  css: {
    devSourcemap: true, // Enable CSS source maps in development
  },
});
