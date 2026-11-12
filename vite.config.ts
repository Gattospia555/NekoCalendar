import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { fileURLToPath } from "node:url";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  // Scorciatoia: "@/domain/dates" invece di "../../domain/dates".
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  // Opzioni per `tauri dev` e `tauri build`:
  // 1. non nascondere gli errori di Rust
  clearScreen: false,
  // 2. Tauri si aspetta una porta fissa: se è occupata, fallisci
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. non ricaricare il frontend quando cambia il codice Rust
      ignored: ["**/src-tauri/**"],
    },
  },

  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    coverage: {
      provider: "v8" as const,
      include: ["src/domain/**/*.ts"],
      exclude: ["src/domain/**/*.test.ts"],
      reporter: ["text", "html"],
      // Obiettivo del progetto: almeno il 70 % sulla logica di dominio.
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
}));
