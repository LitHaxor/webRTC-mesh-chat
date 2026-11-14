import {
  chatOf,
  expect,
  messageRow,
  sendMessage,
  startChat,
  test,
} from "./helpers.ts";

test("two people chat in both directions", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(bob, "hi alice");
  await expect(chatOf(alice)).toContainText("hi alice");

  await sendMessage(alice, "hi bob");
  await expect(chatOf(bob)).toContainText("hi bob");
});

test("each message shows who sent it and how long ago", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(bob, "hello there");
  const row = messageRow(alice, "hello there");

  await expect(row).toContainText("Bob");
  await expect(row).toContainText(/seconds? ago/);
  await expect(row.locator("time")).toHaveAttribute("title", /^\d{2}:\d{2}$/);
});

test("links in messages can be opened", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(bob, "notes: https://example.com/doc");
  const link = alice.getByRole("link", { name: "https://example.com/doc" });

  await expect(link).toHaveAttribute("href", "https://example.com/doc");
  await expect(link).toHaveAttribute("target", "_blank");
});
