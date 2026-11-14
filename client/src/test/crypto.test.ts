import { faker } from "@faker-js/faker";
import { expect, it } from "vitest";
import {
  createKeyPair,
  decryptText,
  deriveSharedKey,
  encryptText,
  exportPublicKey,
} from "../libs/crypto.ts";

faker.seed(7);

const twoPeople = async () => {
  const alice = await createKeyPair();
  const bob = await createKeyPair();
  return {
    aliceKey: await deriveSharedKey(alice, await exportPublicKey(bob)),
    bobKey: await deriveSharedKey(bob, await exportPublicKey(alice)),
  };
};

it("lets each side read what the other encrypted", async () => {
  const { aliceKey, bobKey } = await twoPeople();
  const text = faker.lorem.paragraphs(3);

  const sealed = await encryptText(aliceKey, text);

  expect(await decryptText(bobKey, sealed)).toBe(text);
  expect(await decryptText(aliceKey, await encryptText(bobKey, text))).toBe(
    text,
  );
});

it("never puts the text on the wire", async () => {
  const { aliceKey } = await twoPeople();
  const text = faker.lorem.sentence();

  const sealed = await encryptText(aliceKey, text);

  expect(JSON.stringify(sealed)).not.toContain(text);
});

it("uses a fresh iv, so the same text never looks the same twice", async () => {
  const { aliceKey } = await twoPeople();
  const text = faker.lorem.sentence();

  const first = await encryptText(aliceKey, text);
  const second = await encryptText(aliceKey, text);

  expect(first.iv).not.toBe(second.iv);
  expect(first.data).not.toBe(second.data);
});

it("keeps emoji and other unicode intact", async () => {
  const { aliceKey, bobKey } = await twoPeople();
  const text = "Ünïcødé 🤩🚀 你好";

  expect(await decryptText(bobKey, await encryptText(aliceKey, text))).toBe(
    text,
  );
});

it("cannot be read by someone outside the conversation", async () => {
  const { aliceKey } = await twoPeople();
  const { bobKey: strangerKey } = await twoPeople();

  const sealed = await encryptText(aliceKey, faker.lorem.sentence());

  await expect(decryptText(strangerKey, sealed)).rejects.toThrow();
});

it("refuses a message that was changed on the way", async () => {
  const { aliceKey, bobKey } = await twoPeople();
  const sealed = await encryptText(aliceKey, faker.lorem.sentence());
  const flipped = sealed.data.startsWith("A") ? "B" : "A";

  const tampered = { ...sealed, data: flipped + sealed.data.slice(1) };

  await expect(decryptText(bobKey, tampered)).rejects.toThrow();
});
