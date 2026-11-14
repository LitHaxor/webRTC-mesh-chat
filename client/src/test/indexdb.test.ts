import "fake-indexeddb/auto";
import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";
import { chatDatabase } from "../libs/indexdb.ts";
import type { Message } from "../types/message.ts";

const fakeMessage = (changes: Partial<Message> = {}): Message => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  userName: faker.person.firstName(),
  text: faker.lorem.sentence(),
  createdAt: faker.date.recent().getTime(),
  ...changes,
});

const fakeMessagesInOrder = (count: number) => {
  const times = faker.helpers.uniqueArray(
    () => faker.date.past().getTime(),
    count,
  );
  return times
    .sort((a, b) => a - b)
    .map((createdAt) => fakeMessage({ createdAt }));
};

faker.seed(42);

let roomId = "";

beforeEach(() => {
  roomId = faker.string.uuid();
});

it("keeps each room's messages apart, oldest first", async () => {
  const [first, second] = fakeMessagesInOrder(2);
  await chatDatabase.save(roomId, second);
  await chatDatabase.save(roomId, first);
  await chatDatabase.save(faker.string.uuid(), fakeMessage());

  expect(await chatDatabase.load(roomId)).toStrictEqual([first, second]);
});

it("replaces a message when it is edited", async () => {
  const original = fakeMessage();
  const edited = {
    ...original,
    text: faker.lorem.sentence(),
    editedAt: original.createdAt + 1000,
  };
  await chatDatabase.save(roomId, original);
  await chatDatabase.save(roomId, edited);

  expect(await chatDatabase.load(roomId)).toStrictEqual([edited]);
});

it("keeps a deleted message as deleted", async () => {
  const original = fakeMessage();
  const deleted = {
    ...original,
    text: "",
    deletedAt: original.createdAt + 1000,
  };
  await chatDatabase.save(roomId, original);
  await chatDatabase.save(roomId, deleted);

  expect(await chatDatabase.load(roomId)).toStrictEqual([deleted]);
});

it("has nothing for a room it has never seen", async () => {
  expect(await chatDatabase.load(faker.string.uuid())).toStrictEqual([]);
});

it("keeps every message when many are saved at once", async () => {
  const messages = fakeMessagesInOrder(200);

  await Promise.all(
    faker.helpers
      .shuffle(messages)
      .map((message) => chatDatabase.save(roomId, message)),
  );

  expect(await chatDatabase.load(roomId)).toStrictEqual(messages);
});

it("gives back a copy, so changing it does not change what is stored", async () => {
  const original = fakeMessage();
  await chatDatabase.save(roomId, original);

  const [loaded] = await chatDatabase.load(roomId);
  loaded.text = faker.lorem.sentence();

  expect(await chatDatabase.load(roomId)).toStrictEqual([original]);
});

it("still has the messages after the page reloads", async () => {
  const kept = fakeMessage();
  await chatDatabase.save(roomId, kept);

  vi.resetModules();
  const { chatDatabase: reloaded } = await import("../libs/indexdb.ts");

  expect(await reloaded.load(roomId)).toStrictEqual([kept]);
});
