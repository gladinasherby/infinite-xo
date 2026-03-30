import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/infinite-xo/", // Replace 'your-repo-name' with your actual GitHub repo name
});
