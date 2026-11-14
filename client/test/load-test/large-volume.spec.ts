import {
  chatOf,
  createRoom,
  enterLobby,
  expect,
  lobbyListing,
  fakeConversation,
  messageRow,
  NEWEST_SEEDED,
  ownUserId,
  seedConversation,
  test,
  trackRoomIds,
  uniqueRoomName,
} from "../helpers.ts";
import { arrivalOf, median, saveResult, watchArrivals } from "./results.ts";

const SIZES = [100, 500, 1000, 2500, 5000, 10_000, 20_000];
const PINGS = 5;

for (const size of SIZES) {
  test(`a room with ${size} saved messages`, async ({ newPerson }) => {
    const roomName = uniqueRoomName();
    const alice = await newPerson();
    const bob = await newPerson();
    const roomIds = trackRoomIds(bob);

    await createRoom(alice, "Alice", roomName);
    await enterLobby(bob, "Bob");
    await expect(lobbyListing(bob, roomName)).toBeVisible();
    const roomId = roomIds.get(roomName) ?? "";

    const history = fakeConversation(size, await ownUserId(bob));
    await seedConversation(bob, roomId, history);

    const renderMs = await bob.evaluate(
      async ({ roomName, newest }) => {
        const nextFrame = () =>
          new Promise((resolve) => requestAnimationFrame(resolve));
        const isShown = () => {
          const rows = [...document.querySelectorAll("main ul > li")];
          const row = rows
            .slice(-3)
            .find((item) => item.textContent?.includes(newest));
          if (!row) return false;
          return row.getBoundingClientRect().bottom <= window.innerHeight;
        };
        const listing = [...document.querySelectorAll("li")].find((item) =>
          item.textContent?.includes(roomName),
        );
        const started = performance.now();
        listing?.querySelector("button")?.click();
        while (!isShown()) {
          await nextFrame();
        }
        await nextFrame();
        await nextFrame();
        return performance.now() - started;
      },
      { roomName, newest: NEWEST_SEEDED },
    );

    await expect(chatOf(bob)).toContainText("Alice joined", {
      timeout: 120_000,
    });

    const idle = await bob.evaluate(async () => {
      const SECONDS = 5;
      let frames = 0;
      let worstFrameMs = 0;
      let longTaskMs = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskMs += entry.duration;
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
      const started = performance.now();
      let last = started;
      while (performance.now() - started < SECONDS * 1000) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const now = performance.now();
        worstFrameMs = Math.max(worstFrameMs, now - last);
        last = now;
        frames++;
      }
      observer.disconnect();
      return { fps: frames / SECONDS, worstFrameMs, longTaskMs };
    });

    const page = await bob.evaluate(() => {
      const collect = (window as unknown as { gc?: () => void }).gc;
      collect?.();
      const memory = (
        performance as unknown as { memory: { usedJSHeapSize: number } }
      ).memory;
      return {
        domNodes: document.querySelectorAll("*").length,
        heapMb: memory.usedJSHeapSize / 1024 / 1024,
      };
    });

    await watchArrivals(bob);
    const receiveMs: number[] = [];
    for (let i = 0; i < PINGS; i++) {
      const text = `ping-in-${i}`;
      await alice.getByPlaceholder("Write to everyone").fill(text);
      const sentAt = Date.now();
      await alice.keyboard.press("Enter");
      await expect(messageRow(bob, text)).toBeVisible({ timeout: 120_000 });
      receiveMs.push((await arrivalOf(bob, text)) - sentAt);
    }
    const sendMs: number[] = [];
    for (let i = 0; i < PINGS; i++) {
      const text = `ping-out-${i}`;
      await bob.getByPlaceholder("Write to everyone").fill(text);
      const sentAt = Date.now();
      await bob.keyboard.press("Enter");
      await expect(messageRow(bob, text)).toBeVisible({ timeout: 120_000 });
      sendMs.push((await arrivalOf(bob, text)) - sentAt);
    }

    saveResult("large-volume.json", String(size), {
      size,
      renderMs,
      ...idle,
      ...page,
      receiveMs: median(receiveMs),
      sendMs: median(sendMs),
    });
  });
}
