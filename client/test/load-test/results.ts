import type { Page } from "../helpers.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DATA_DIR = new URL("../../../docs/data/", import.meta.url);

export const saveResult = (file: string, key: string, value: unknown) => {
  mkdirSync(DATA_DIR, { recursive: true });
  const path = new URL(file, DATA_DIR);
  const saved: Record<string, unknown> = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : {};
  saved[key] = value;
  writeFileSync(path, `${JSON.stringify(saved, null, 2)}\n`);
};

export const watchArrivals = (page: Page) =>
  page.evaluate(() => {
    const arrivals: Record<string, number> = {};
    Object.assign(window, { arrivals });
    const list = document.querySelector("main ul");
    if (!list) return;
    const record = () => {
      const recent = list.querySelectorAll("li:nth-last-child(-n+3) p");
      for (const paragraph of recent) {
        const text = paragraph.textContent ?? "";
        if (text.startsWith("ping-") && !(text in arrivals)) {
          arrivals[text] = Date.now();
        }
      }
    };
    new MutationObserver(record).observe(list, {
      childList: true,
      subtree: true,
    });
  });

export const arrivalOf = (page: Page, text: string) =>
  page.evaluate(
    (key) =>
      (window as unknown as { arrivals: Record<string, number> }).arrivals[key],
    text,
  );

export const median = (values: number[]) => {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
