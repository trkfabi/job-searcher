import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/job-searcher/",
  plugins: [react()],
  define: {
    __API_BASE__: JSON.stringify("/job-searcher/api"),
  },
});
