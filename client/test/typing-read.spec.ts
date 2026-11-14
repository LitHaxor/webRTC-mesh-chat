import {
  expect,
  messageRow,
  savedTexts,
  sendMessage,
  startChat,
  test,
} from "./helpers.ts";

test("the other person sees you typing until you send", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);

  await alice.getByPlaceholder("Write to everyone").fill("hel");
  await expect(bob.getByText("Alice is typing…")).toBeVisible();

  await sendMessage(alice, "hello");
  await expect(messageRow(bob, "hello")).toBeVisible();
  await expect(bob.getByText("Alice is typing…")).toHaveCount(0);
});

test("your message shows Seen once the other person has read it", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);

  await sendMessage(alice, "did you see this?");
  await expect(messageRow(bob, "did you see this?")).toBeVisible();

  await expect(
    messageRow(alice, "did you see this?").getByLabel("Seen"),
  ).toBeVisible();
});

test("a message is only Seen once the other person opens the chat", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson);
  await bob.getByRole("tab", { name: "Participants (2)" }).click();

  await sendMessage(alice, "are you there?");
  await expect.poll(() => savedTexts(bob)).toContain("are you there?");
  const seen = messageRow(alice, "are you there?").getByLabel("Seen");
  await expect(seen).toHaveCount(0);

  await bob.getByRole("tab", { name: "Chat" }).click();
  await expect(seen).toBeVisible();
});
