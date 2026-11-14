import { expect, it } from "vitest";
import { formatRelativeTime, formatTime } from "../utils/formatTime.ts";
import { findUrl, isImageUrl, linkify } from "../utils/linkify.tsx";
import { getParticipants } from "../utils/participants.ts";

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

it("never shows a time in the future", () => {
  const now = Date.now();

  expect(formatRelativeTime(now + 500, now)).toBe("0 seconds ago");
});

it("turns links in a message into anchors", () => {
  const [before, link, after] = linkify("see https://example.com/doc please");

  expect(before).toBe("see ");
  expect(link).toMatchObject({ props: { href: "https://example.com/doc" } });
  expect(after).toBe(" please");
});

it("finds the first link in a message", () => {
  expect(findUrl("see https://a.com and https://b.com")).toBe("https://a.com");
  expect(findUrl("no links here")).toBeUndefined();
});

it("recognises a message that is only an image link", () => {
  expect(
    isImageUrl("https://media.giphy.com/media/abc/200.gif?cid=1&ct=g"),
  ).toBe(true);
  expect(isImageUrl("look https://example.com/cat.png")).toBe(false);
  expect(isImageUrl("https://example.com/doc")).toBe(false);
});

it("lists everyone who has been in the room and who is active now", () => {
  const participants = getParticipants(
    "Alice",
    ["Kiana"],
    [
      { type: "joined", userName: "Bob", createdAt: 1 },
      { type: "left", userName: "Bob", createdAt: 2 },
      { type: "joined", userName: "Kiana", createdAt: 3 },
    ],
  );

  expect(participants).toEqual([
    { name: "Alice", active: true },
    { name: "Bob", active: false },
    { name: "Kiana", active: true },
  ]);
});
