import { expect, test, type Page } from "@playwright/test";

const enterName = async (page: Page, name: string) => {
  await page.goto("/");
  await page.getByPlaceholder("Your name").fill(name);
};

const joinRoom = async (page: Page, roomName: string) => {
  await page
    .getByRole("listitem")
    .filter({ hasText: roomName })
    .getByRole("button", { name: "Join" })
    .click();
  await expect(page.getByRole("heading", { name: roomName })).toBeVisible();
};

test("two people chat in a room one of them created", async ({ browser }) => {
  const roomName = `Room ${Date.now()}`;
  const alice = await browser.newPage();
  const bob = await browser.newPage();

  await enterName(alice, "Alice");
  await alice.getByPlaceholder("New room name").fill(roomName);
  await alice.getByRole("button", { name: "Create" }).click();
  await expect(alice.getByRole("heading", { name: roomName })).toBeVisible();

  await enterName(bob, "Bob");
  await joinRoom(bob, roomName);
  await expect(alice.getByRole("list")).toContainText("Bob joined");

  await bob.getByPlaceholder("Write to everyone").fill("hi alice");
  await bob.getByRole("button", { name: "Send" }).click();
  await expect(alice.getByRole("list")).toContainText("hi alice");

  await alice.getByPlaceholder("Write to everyone").fill("hi bob");
  await alice.getByRole("button", { name: "Send" }).click();
  await expect(bob.getByRole("list")).toContainText("hi bob");

  const aliceMessage = alice.getByRole("listitem").filter({ hasText: "hi bob" });
  await aliceMessage.hover();
  await aliceMessage.getByRole("button", { name: "Edit message" }).click();
  await alice.getByRole("textbox", { name: "Edit message" }).fill("hi bob, edited");
  await alice.keyboard.press("Enter");
  const bobsCopy = bob.getByRole("listitem").filter({ hasText: "hi bob, edited" });
  await expect(bobsCopy).toContainText("(edited)");
  await expect(
    bobsCopy.getByRole("button", { name: "Edit message" }),
  ).toHaveCount(0);

  const bobMessage = bob.getByRole("listitem").filter({ hasText: "hi alice" });
  await bobMessage.hover();
  await bobMessage.getByRole("button", { name: "Delete message" }).click();
  await expect(alice.getByRole("list")).toContainText("Message deleted");
  await expect(alice.getByRole("list")).not.toContainText("hi alice");

  await enterName(bob, "Bob");
  await expect(alice.getByRole("list")).toContainText("Bob left");
  await joinRoom(bob, roomName);
  await expect(alice.getByRole("list")).toContainText("Bob rejoined");
});
