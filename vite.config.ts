import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/kaimakki-pricing-calculator/",
  server: { port: 3000 },
});
