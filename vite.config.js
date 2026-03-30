import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/infinite-xo/", // Using './' ensures it works on any GitHub URL
});
