import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

export default defineConfig({
  ...base,
  testIgnore: [],
  testDir: "test/load-test",
  workers: 1,
  timeout: 900_000,
  use: {
    ...base.use,
    launchOptions: {
      args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"],
    },
  },
});
