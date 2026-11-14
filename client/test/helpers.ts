import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import type { Message } from "../src/types/message.ts";

export { expect };

type NewPerson = () => Promise<Page>;

export const test = base.extend<{ newPerson: NewPerson }>({
  newPerson: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = [];
    await provide(async () => {
      const context = await browser.newContext();
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

export const uniqueRoomName = () =>
  `Room ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const enterLobby = async (page: Page, name: string, path = "/") => {
  await page.goto(path);
  await page.getByPlaceholder("Your name").fill(name);
};

export const lobbyListing = (page: Page, roomName: string) =>
  page.getByRole("listitem").filter({ hasText: roomName });

export const createRoom = async (
  page: Page,
  name: string,
  roomName: string,
  path = "/",
) => {
  await enterLobby(page, name, path);
  await page.getByPlaceholder("New room name").fill(roomName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: roomName })).toBeVisible();
};

export const joinRoom = async (
  page: Page,
  name: string,
  roomName: string,
  path = "/",
) => {
  await enterLobby(page, name, path);
  await lobbyListing(page, roomName)
    .getByRole("button", { name: "Join" })
    .click();
  await expect(page.getByRole("heading", { name: roomName })).toBeVisible();
};

export const chatOf = (page: Page) => page.getByRole("list");

export const messageRow = (page: Page, text: string) =>
  page.getByRole("listitem").filter({ hasText: text });

export const sendMessage = async (page: Page, text: string) => {
  await page.getByPlaceholder("Write to everyone").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
};

export const startChat = async (newPerson: NewPerson, path = "/") => {
  const roomName = uniqueRoomName();
  const alice = await newPerson();
  const bob = await newPerson();

  await createRoom(alice, "Alice", roomName, path);
  await joinRoom(bob, "Bob", roomName, path);
  await expect(chatOf(alice)).toContainText("Bob joined");
  await expect(chatOf(bob)).toContainText("Alice joined");

  return { alice, bob, roomName };
};

type OriginWithIndexedDB = {
  indexedDB?: { stores: { name: string; records: { value: unknown }[] }[] }[];
};

export const savedTexts = async (page: Page) => {
  const state = await page.context().storageState({ indexedDB: true });
  const origins = state.origins as OriginWithIndexedDB[];
  const databases = origins.flatMap((origin) => origin.indexedDB ?? []);
  const stores = databases.flatMap((database) => database.stores);
  const messageStore = stores.find((store) => store.name === "messages");
  const messages = (messageStore?.records ?? []).map(
    (record) => (record.value as { message: Message }).message,
  );

  return messages
    .toSorted((a, b) => a.createdAt - b.createdAt)
    .map((message) => (message.deletedAt ? "(deleted)" : message.text));
};

export const recordSentFrames = (page: Page) =>
  page.addInitScript(() => {
    const frames: string[] = [];
    const original: (this: RTCDataChannel, data: string) => void =
      RTCDataChannel.prototype.send;
    function recording(this: RTCDataChannel, data: string) {
      frames.push(data);
      original.call(this, data);
    }
    RTCDataChannel.prototype.send = recording as RTCDataChannel["send"];
    Object.assign(window, { sentFrames: frames });
  });

export const sentFrames = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { sentFrames: string[] }).sentFrames,
  );
