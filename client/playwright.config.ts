import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  use: { baseURL: "http://localhost:5175", channel: "chrome" },
  webServer: [
    {
      command: "make -C ../signal-svc start",
      url: "http://localhost:8080/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 5175 --strictPort",
      url: "http://localhost:5175",
      reuseExistingServer: true,
      env: { VITE_GIPHY_API_KEY: "e2e" },
    },
  ],
});
