import { expect, test, type Page } from "@playwright/test";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { firestore } from "../src/libs/firebase.ts";

const room = doc(firestore, "rooms", "main");

const join = async (page: Page, name: string) => {
  await page.goto("/");
  await page.getByPlaceholder("Your name").fill(name);
  await page.getByRole("button", { name: "Join" }).click();
};

test("two people can chat", async ({ browser }) => {
  await deleteDoc(room);
  const alice = await browser.newPage();
  const bob = await browser.newPage();

  await join(alice, "Alice");
  await expect.poll(async () => (await getDoc(room)).data()?.offer).toBeTruthy();
  await join(bob, "Bob");
  await expect.poll(async () => (await getDoc(room)).data()?.answer).toBeTruthy();

  await expect(async () => {
    await bob.getByPlaceholder("Write to everyone").fill("hi alice");
    await bob.getByRole("button", { name: "Send" }).click();
    await expect(alice.getByRole("list")).toContainText("hi alice", {
      timeout: 1000,
    });
  }).toPass();
});
