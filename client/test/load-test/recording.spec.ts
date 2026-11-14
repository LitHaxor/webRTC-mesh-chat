import { copyFileSync, mkdirSync } from "node:fs";
import {
  NEWEST_SEEDED,
  chatOf,
  createRoom,
  enterLobby,
  expect,
  fakeConversation,
  lobbyListing,
  messageRow,
  ownUserId,
  seedConversation,
  sendMessage,
  test,
  trackRoomIds,
  type Page,
} from "../helpers.ts";

const COUNT = 10_000;
const SIZE = { width: 420, height: 660 };
const NAME = process.env.RECORD_AS ?? "after";
const VIDEOS = new URL("../../../docs/data/videos/", import.meta.url).pathname;
const SLOW = { timeout: 120_000 };

const showFrameRate = (page: Page) =>
  page.evaluate(() => {
    const badge = document.createElement("div");
    badge.setAttribute(
      "style",
      "position:fixed;top:18px;right:64px;padding:3px 10px;border-radius:999px;font:600 13px system-ui;color:#fff;background:#15803d;z-index:10",
    );
    document.body.append(badge);
    let frames = 0;
    let since = performance.now();
    const count = () => {
      frames++;
      const now = performance.now();
      if (now - since >= 500) {
        const rate = Math.round((frames * 1000) / (now - since));
        badge.textContent = `${rate} frames per second`;
        badge.style.background = rate >= 45 ? "#15803d" : "#b91c1c";
        frames = 0;
        since = now;
      }
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  });

test("record a room with 10,000 messages from six people", async ({
  browser,
  newPerson,
}) => {
  const roomName = `Standup ${Date.now() % 1000}`;
  const alice = await newPerson();
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: VIDEOS, size: SIZE },
  });
  const bob = await context.newPage();
  const roomIds = trackRoomIds(bob);

  await createRoom(alice, "Alice", roomName);
  await enterLobby(bob, "Bob");
  await expect(lobbyListing(bob, roomName)).toBeVisible();
  const history = fakeConversation(COUNT, await ownUserId(bob));
  await seedConversation(bob, roomIds.get(roomName) ?? "", history);
  await showFrameRate(bob);
  await bob.waitForTimeout(1000);

  await lobbyListing(bob, roomName).getByRole("button").click();
  await expect(messageRow(bob, NEWEST_SEEDED)).toBeInViewport(SLOW);
  await expect(chatOf(alice)).toContainText("Bob joined", SLOW);
  await bob.waitForTimeout(2500);

  for (const text of ["Is everyone here?", "Let's start", "First item 👇"]) {
    await sendMessage(alice, text);
    await expect(messageRow(bob, text)).toBeVisible(SLOW);
    await bob.waitForTimeout(500);
  }

  await bob
    .getByPlaceholder("Write to everyone")
    .pressSequentially("Typing in a room this big", { delay: 70 });
  await bob.keyboard.press("Enter");
  await expect(messageRow(bob, "Typing in a room this big")).toBeVisible(SLOW);
  await bob.waitForTimeout(1000);

  await bob.mouse.move(210, 330);
  for (let step = 0; step < 8; step++) {
    await bob.mouse.wheel(0, -350);
    await bob.waitForTimeout(250);
  }
  await bob.waitForTimeout(1000);
  await bob
    .getByRole("button", { name: "Scroll to the newest message" })
    .click();
  await bob.waitForTimeout(2000);

  await context.close();
  const video = await bob.video()?.path();
  mkdirSync(VIDEOS, { recursive: true });
  if (video) {
    copyFileSync(video, `${VIDEOS}large-room-${NAME}.webm`);
  }
});
