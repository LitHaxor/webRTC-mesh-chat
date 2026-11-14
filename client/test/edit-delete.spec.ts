import {
  chatOf,
  expect,
  messageRow,
  sendMessage,
  startChat,
  test,
} from "./helpers.ts";

test("you can edit your own message, and the other person sees it was edited", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  await sendMessage(alice, "helo");
  await expect(messageRow(bob, "helo")).toBeVisible();

  const row = messageRow(alice, "helo");
  await row.hover();
  await row.getByRole("button", { name: "Edit message" }).click();
  await alice.getByRole("textbox", { name: "Edit message" }).fill("hello");
  await alice.keyboard.press("Enter");

  await expect(messageRow(alice, "hello")).toContainText("(edited)");
  await expect(messageRow(bob, "hello")).toContainText("(edited)");
});

test("pressing Escape cancels an edit", async ({ newPerson }) => {
  const { alice } = await startChat(newPerson);
  await sendMessage(alice, "keep me");

  const row = messageRow(alice, "keep me");
  await row.hover();
  await row.getByRole("button", { name: "Edit message" }).click();
  await alice.getByRole("textbox", { name: "Edit message" }).fill("changed");
  await alice.keyboard.press("Escape");

  await expect(row).toContainText("keep me");
  await expect(row).not.toContainText("(edited)");
});

test("you can delete your own message, and the other person sees it was deleted", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  await sendMessage(bob, "oops");
  await expect(messageRow(alice, "oops")).toBeVisible();

  const row = messageRow(bob, "oops");
  await row.hover();
  await row.getByRole("button", { name: "Delete message" }).click();

  await expect(chatOf(alice)).toContainText("Message deleted");
  await expect(chatOf(alice)).not.toContainText("oops");
  await expect(chatOf(bob)).toContainText("Message deleted");
});

test("you cannot edit or delete the other person's messages", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  await sendMessage(alice, "mine");

  const row = messageRow(bob, "mine");
  await expect(row).toBeVisible();
  await row.hover();

  await expect(row.getByRole("button", { name: "Edit message" })).toHaveCount(
    0,
  );
  await expect(row.getByRole("button", { name: "Delete message" })).toHaveCount(
    0,
  );
});
