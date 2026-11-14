import {
  enterLobby,
  expect,
  lobbyListing,
  messageRow,
  startChat,
  test,
  uniqueRoomName,
  type Browser,
  type Page,
} from "../helpers.ts";
import { arrivalOf, saveResult, watchArrivals } from "./results.ts";

const ROUNDS = 15;
const PINGS = 200;

const openPage = async (browser: Browser) => {
  const context = await browser.newContext();
  return context.newPage();
};

const whenTextAppears = (page: Page, selector: string, text: string) =>
  page.evaluate(
    async ({ selector, text }) => {
      const nextFrame = () =>
        new Promise((resolve) => requestAnimationFrame(resolve));
      const isThere = () =>
        [...document.querySelectorAll(selector)].some((element) =>
          element.textContent?.includes(text),
        );
      while (!isThere()) {
        await nextFrame();
      }
      return Date.now();
    },
    { selector, text },
  );

const clickJoin = (page: Page, roomName: string) =>
  page.evaluate((roomName) => {
    const listing = [...document.querySelectorAll("li")].find((item) =>
      item.textContent?.includes(roomName),
    );
    listing?.querySelector("button")?.click();
    return Date.now();
  }, roomName);

test("how long connecting, leaving and re-opening take", async ({
  browser,
}) => {
  const watcher = await openPage(browser);
  await enterLobby(watcher, "Watcher");
  const rounds = [];

  for (let round = 0; round < ROUNDS; round++) {
    const roomName = uniqueRoomName();
    const alice = await openPage(browser);
    const bob = await openPage(browser);
    await enterLobby(alice, "Alice");
    await enterLobby(bob, "Bob");
    await alice.getByPlaceholder("New room name").fill(roomName);

    const listed = whenTextAppears(watcher, "main li", roomName);
    const createdAt = Date.now();
    await alice.getByRole("button", { name: "Create" }).click();
    const listMs = (await listed) - createdAt;

    await expect(lobbyListing(bob, roomName)).toBeVisible();
    const connected = whenTextAppears(bob, "main ul", "Alice joined");
    const joinedAt = await clickJoin(bob, roomName);
    const connectMs = (await connected) - joinedAt;

    const noticed = whenTextAppears(alice, "main ul", "Bob left");
    const closedAt = Date.now();
    await bob.close();
    const noticeMs = (await noticed) - closedAt;

    const bobAgain = await openPage(browser);
    await enterLobby(bobAgain, "Bob");
    await expect(lobbyListing(bobAgain, roomName)).toBeVisible();
    const reconnected = whenTextAppears(bobAgain, "main ul", "Alice joined");
    const rejoinedAt = await clickJoin(bobAgain, roomName);
    const reconnectMs = (await reconnected) - rejoinedAt;

    rounds.push({ listMs, connectMs, noticeMs, reconnectMs });
    await alice.context().close();
    await bob.context().close();
    await bobAgain.context().close();
  }

  saveResult("realtime.json", "rounds", rounds);
});

test("how long a message takes to reach the other screen", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  await watchArrivals(bob);
  const latencies: number[] = [];

  for (let i = 0; i < PINGS; i++) {
    const text = `ping-${i}`;
    await alice.getByPlaceholder("Write to everyone").fill(text);
    const sentAt = Date.now();
    await alice.keyboard.press("Enter");
    await expect(messageRow(bob, text).last()).toBeVisible();
    latencies.push((await arrivalOf(bob, text)) - sentAt);
  }

  saveResult("realtime.json", "latencies", latencies);
});
