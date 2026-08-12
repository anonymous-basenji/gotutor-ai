import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  envDir: "../",
  server: {
    allowedHosts: [
      "improve-palpitate-oxidize.ngrok-free.dev",
      ".ngrok-free.dev",
      ".ngrok-free.app",
      ".ngrok.io"
    ]
  }
});
