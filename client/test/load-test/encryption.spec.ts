import { expect, messageRow, startChat, test, type Page } from "../helpers.ts";
import { saveResult } from "./results.ts";

const SIZES = [
  100, 1000, 10_000, 25_000, 50_000, 75_000, 100_000, 125_000, 150_000, 200_000,
  250_000, 500_000, 1_000_000,
];
const UI_SIZES = [1000, 50_000, 100_000, 150_000, 200_000, 300_000];

const arrives = async (page: Page, marker: string) => {
  try {
    await messageRow(page, marker).waitFor({ timeout: 8000 });
    return true;
  } catch {
    return false;
  }
};

test("what encryption costs and where it stops", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  const measured = await alice.evaluate(async (sizes) => {
    const path = "/src/libs/crypto.ts";
    const lib: typeof import("../../src/libs/crypto.ts") = await import(path);
    const mine = await lib.createKeyPair();
    const theirs = await lib.createKeyPair();
    const myKey = await lib.deriveSharedKey(
      mine,
      await lib.exportPublicKey(theirs),
    );
    const theirKey = await lib.deriveSharedKey(
      theirs,
      await lib.exportPublicKey(mine),
    );

    const attempt = async (text: string) => {
      try {
        const started = performance.now();
        const sealed = await lib.encryptText(myKey, text);
        const encryptMs = performance.now() - started;
        const frame = JSON.stringify({ type: "encrypted", ...sealed });
        const opened = performance.now();
        const back = await lib.decryptText(theirKey, sealed);
        const decryptMs = performance.now() - opened;
        return {
          ok: back === text,
          frameBytes: frame.length,
          encryptMs,
          decryptMs,
          error: null,
        };
      } catch (error) {
        return {
          ok: false,
          frameBytes: 0,
          encryptMs: 0,
          decryptMs: 0,
          error: String(error),
        };
      }
    };

    const largest = async (unit: string) => {
      let low = 1;
      let high = 4_000_000;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const result = await attempt(unit.repeat(middle));
        if (result.ok) {
          low = middle;
        } else {
          high = middle - 1;
        }
      }
      return low;
    };

    const sweep = [];
    for (const size of sizes) {
      const text = "a".repeat(size);
      const runs = [
        await attempt(text),
        await attempt(text),
        await attempt(text),
      ];
      const best = runs.toSorted((a, b) => a.encryptMs - b.encryptMs)[0];
      sweep.push({
        size,
        textBytes: new TextEncoder().encode(text).length,
        ...best,
      });
    }

    const a = new RTCPeerConnection();
    const b = new RTCPeerConnection();
    a.createDataChannel("probe");
    await a.setLocalDescription();
    await b.setRemoteDescription(a.localDescription!);
    await b.setLocalDescription();
    await a.setRemoteDescription(b.localDescription!);
    const channelLimit = a.sctp?.maxMessageSize ?? null;
    a.close();
    b.close();

    return {
      sweep,
      largestAscii: await largest("a"),
      largestEmoji: await largest("🤩"),
      channelLimit,
    };
  }, SIZES);

  const delivered = [];
  for (const size of UI_SIZES) {
    const marker = `big-${size}-`;
    await alice
      .getByPlaceholder("Write to everyone")
      .fill(marker + "x".repeat(size - marker.length));
    await alice.keyboard.press("Enter");
    const row = messageRow(alice, marker);
    await expect(row).toBeVisible();
    const arrived = await arrives(bob, marker);
    const stuck = (await row.getByLabel("Sending").count()) > 0;
    delivered.push({ size, arrived, stuck });
  }

  saveResult("encryption.json", "crypto", measured);
  saveResult("encryption.json", "delivered", delivered);
});
