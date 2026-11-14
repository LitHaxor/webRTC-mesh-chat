import { chatOf, expect, sendMessage, startChat, test } from "./helpers.ts";

test("the /old page still connects and chats through Firebase", async ({
  newPerson,
}) => {
  const { alice, bob } = await startChat(newPerson, "/old");

  await sendMessage(bob, "via firebase");
  await expect(chatOf(alice)).toContainText("via firebase");
});
