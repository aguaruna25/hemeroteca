import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  base: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/` : "/",
  build: { outDir: "dist", rollupOptions: { input: { main: resolve(process.cwd(), "index.html"), diagnosticoReact: resolve(process.cwd(), "diagnostico-react.html"), diagnosticoRouter: resolve(process.cwd(), "diagnostico-router.html"), diagnosticoContacto: resolve(process.cwd(), "diagnostico-contacto.html"), panel: resolve(process.cwd(), "panel.html") } } },
});
