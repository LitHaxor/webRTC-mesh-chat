import {
  chatOf,
  expect,
  joinRoom,
  messageRow,
  savedTexts,
  sendMessage,
  startChat,
  test,
} from "./helpers.ts";

test("messages, edits and deletes are still there after a reload", async ({
  newPerson,
}) => {
  const { alice, bob, roomName } = await startChat(newPerson);
  await sendMessage(alice, "kept after reload");
  await sendMessage(bob, "fix me");
  await sendMessage(bob, "remove me");
  await expect(messageRow(alice, "remove me")).toBeVisible();

  const toEdit = messageRow(bob, "fix me");
  await toEdit.hover();
  await toEdit.getByRole("button", { name: "Edit message" }).click();
  await bob.getByRole("textbox", { name: "Edit message" }).fill("fixed");
  await bob.keyboard.press("Enter");
  const toDelete = messageRow(bob, "remove me");
  await toDelete.hover();
  await toDelete.getByRole("button", { name: "Delete message" }).click();
  await expect(chatOf(alice)).toContainText("Message deleted");
  await expect
    .poll(() => savedTexts(bob))
    .toEqual(["kept after reload", "fixed", "(deleted)"]);

  await bob.reload();
  await expect(chatOf(alice)).toContainText("Bob left");
  await joinRoom(bob, "Bob", roomName);

  await expect(messageRow(bob, "kept after reload")).toContainText("Alice");
  await expect(messageRow(bob, "fixed")).toContainText("(edited)");
  await expect(chatOf(bob)).toContainText("Message deleted");
  await expect(chatOf(bob)).not.toContainText("remove me");
});

test("you can still edit your own message after a reload", async ({
  newPerson,
}) => {
  const { alice, bob, roomName } = await startChat(newPerson);
  await sendMessage(bob, "typo here");
  await expect(messageRow(alice, "typo here")).toBeVisible();
  await expect.poll(() => savedTexts(bob)).toEqual(["typo here"]);

  await bob.reload();
  await expect(chatOf(alice)).toContainText("Bob left");
  await joinRoom(bob, "Bob", roomName);
  await expect(chatOf(alice)).toContainText("Bob rejoined");

  const row = messageRow(bob, "typo here");
  await row.hover();
  await row.getByRole("button", { name: "Edit message" }).click();
  await bob.getByRole("textbox", { name: "Edit message" }).fill("typo fixed");
  await bob.keyboard.press("Enter");

  await expect(messageRow(alice, "typo fixed")).toContainText("(edited)");
});
