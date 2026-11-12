import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src-tauri/target", "src-tauri/gen"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  // --- Regola delle dipendenze: le frecce vanno sempre verso il dominio ---
  //   presentation -> infrastructure -> domain      (mai al contrario)
  {
    // Dominio: logica pura. Niente Tauri, React, DOM, né gli altri livelli.
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@tauri-apps/*", "react", "react-dom", "react-dom/*"],
              message: "Il dominio resta puro: niente Tauri né React (vedi docs/adr/0005).",
            },
            {
              group: [
                "@/infrastructure",
                "@/infrastructure/*",
                "@/presentation",
                "@/presentation/*",
              ],
              message: "Il dominio non dipende dagli altri livelli: sono loro a dipendere da lui.",
            },
          ],
        },
      ],
    },
  },
  {
    // Infrastruttura: parla con Tauri/Windows. Non conosce l'interfaccia.
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/presentation", "@/presentation/*"],
              message: "L'infrastruttura non conosce l'interfaccia grafica.",
            },
          ],
        },
      ],
    },
  },
  {
    // Interfaccia: per parlare con Tauri passa sempre da src/infrastructure.
    files: ["src/presentation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@tauri-apps/*"],
              message: "Usa Tauri solo tramite src/infrastructure/tauri.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["*.config.{js,ts}", "scripts/**/*.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
