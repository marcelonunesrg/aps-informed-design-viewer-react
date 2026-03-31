import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serverPort = Number(env.VITE_DEV_SERVER_PORT || 8080);
  const backendPort = Number(env.VITE_BACKEND_PORT || 8787);

  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
    server: {
      port: Number.isFinite(serverPort) ? serverPort : 8080,
      proxy: {
        "/api": {
          target: `http://localhost:${Number.isFinite(backendPort) ? backendPort : 8787}`,
          changeOrigin: true,
        },
      },
    },
  };
});
