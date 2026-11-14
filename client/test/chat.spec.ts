import {
  chatOf,
  expect,
  messageRow,
  savedTexts,
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
  await expect(row).toContainText("a few seconds ago");
  await expect(row.locator("time")).toHaveAttribute("title", /^\d{2}:\d{2}$/);
});

test("the chat keeps the newest message in view", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  for (let count = 1; count <= 15; count++) {
    await sendMessage(alice, `message ${count}`);
  }
  await expect(messageRow(bob, "message 15")).toBeInViewport();

  await sendMessage(alice, "docs: http://localhost:8080/docs");
  await expect(bob.getByRole("link", { name: /Swagger UI/ })).toBeInViewport();
});

test("scrolling up shows a button that jumps back to the newest message", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  for (let count = 1; count <= 15; count++) {
    await sendMessage(alice, `message ${count}`);
  }
  await expect(messageRow(bob, "message 15")).toBeInViewport();

  await chatOf(bob).evaluate((list) =>
    list.parentElement?.scrollTo({ top: 0 }),
  );
  const jump = bob.getByRole("button", {
    name: "Scroll to the newest message",
  });
  await expect(jump).toBeVisible();

  await sendMessage(alice, "while you were away");
  await expect.poll(() => savedTexts(bob)).toContain("while you were away");
  await expect(messageRow(bob, "while you were away")).not.toBeInViewport();

  await jump.click();
  await expect(messageRow(bob, "while you were away")).toBeInViewport();
  await expect(jump).toHaveCount(0);
});

test("links in messages can be opened", async ({ newPerson }) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(bob, "notes: https://example.com/doc");
  const link = alice.getByRole("link", { name: "https://example.com/doc" });

  await expect(link).toHaveAttribute("href", "https://example.com/doc");
  await expect(link).toHaveAttribute("target", "_blank");
});
