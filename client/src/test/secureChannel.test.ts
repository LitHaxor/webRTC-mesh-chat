import { faker } from "@faker-js/faker";
import { beforeEach, expect, it, vi } from "vitest";
import { secureChannel } from "../libs/secureChannel.ts";
import type { Frame } from "../types/frames.ts";

faker.seed(11);

const connect = () => {
  const wire: Frame[] = [];
  const readByAlice: string[] = [];
  const readByBob: string[] = [];
  const link = (deliver: () => (raw: string) => void) => ({
    send: (raw: string) => {
      wire.push(JSON.parse(raw));
      deliver()(raw);
    },
  });

  const alice = secureChannel(
    link(() => bob.receive),
    (text) => readByAlice.push(text),
  );
  const bob = secureChannel(
    link(() => alice.receive),
    (text) => readByBob.push(text),
  );

  return { alice, bob, wire, readByAlice, readByBob };
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

it("sends only the public keys in the clear, and every message encrypted", async () => {
  const { alice, bob, wire } = connect();
  const text = faker.lorem.sentence();

  alice.start();
  bob.start();
  await alice.send(text);

  const types = wire.map((frame) => frame.type);
  expect(types.filter((type) => type === "key")).toHaveLength(2);
  expect(types).toContain("encrypted");
  expect(JSON.stringify(wire)).not.toContain(text);
});

it("delivers messages in the order they were sent", async () => {
  const { alice, bob, readByBob } = connect();
  const texts = faker.helpers.multiple(() => faker.lorem.sentence(), {
    count: 20,
  });

  alice.start();
  bob.start();
  await Promise.all(texts.map((text) => alice.send(text)));

  await vi.waitFor(() => expect(readByBob).toStrictEqual(texts));
});

it("holds messages sent before the keys are exchanged, then delivers them", async () => {
  const { alice, bob, readByBob } = connect();
  const early = faker.lorem.sentence();

  const sending = alice.send(early);
  alice.start();
  bob.start();

  expect(await sending).toBe(true);
  await vi.waitFor(() => expect(readByBob).toStrictEqual([early]));
});

it("works in both directions", async () => {
  const { alice, bob, readByAlice, readByBob } = connect();
  const fromAlice = faker.lorem.sentence();
  const fromBob = faker.lorem.sentence();

  alice.start();
  bob.start();
  await alice.send(fromAlice);
  await bob.send(fromBob);

  await vi.waitFor(() => {
    expect(readByBob).toStrictEqual([fromAlice]);
    expect(readByAlice).toStrictEqual([fromBob]);
  });
});

it("reports a message as not sent when the channel fails", async () => {
  const failing = secureChannel(
    {
      send: () => {
        throw new Error("closed");
      },
    },
    () => {},
  );
  const other = secureChannel(
    { send: (raw) => failing.receive(raw) },
    () => {},
  );

  other.start();

  expect(await failing.send(faker.lorem.sentence())).toBe(false);
});
