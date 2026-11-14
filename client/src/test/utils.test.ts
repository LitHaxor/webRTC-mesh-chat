import { expect, it } from "vitest";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { linkify } from "../utils/linkify.tsx";

it("formats a time as 24-hour hours and minutes", () => {
  expect(formatTime(new Date(2026, 0, 1, 9, 5).getTime())).toBe("09:05");
});

it("shows how long ago something happened", () => {
  const now = Date.now();

  expect(formatRelativeTime(now - 1_000, now)).toBe("1 second ago");
  expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5 minutes ago");
  expect(formatRelativeTime(now - 90 * 60_000, now)).toBe("1 hour ago");
  expect(formatRelativeTime(now - 86_400_000, now)).toBe("1 day ago");
});

it("turns links in a message into anchors", () => {
  const [before, link, after] = linkify("see https://example.com/doc please");

  expect(before).toBe("see ");
  expect(link).toMatchObject({ props: { href: "https://example.com/doc" } });
  expect(after).toBe(" please");
});
