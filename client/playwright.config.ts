import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  use: { baseURL: "http://localhost:5175", channel: "chrome" },
  webServer: {
    command: "npm run dev -- --port 5175 --strictPort",
    url: "http://localhost:5175",
    reuseExistingServer: true,
  },
});
