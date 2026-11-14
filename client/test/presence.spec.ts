import {
  chatOf,
  enterLobby,
  expect,
  joinRoom,
  lobbyListing,
  sendMessage,
  startChat,
  test,
} from "./helpers.ts";

test("the participants tab shows both people as active", async ({
  newPerson,
}) => {
  const { alice } = await startChat(newPerson);

  await alice.getByRole("tab", { name: "Participants (2)" }).click();

  await expect(alice.getByRole("list")).toContainText(["Alice"]);
  await expect(alice.getByRole("list")).toContainText(["Bob"]);
  await expect(alice.getByTitle("Active")).toHaveCount(2);
});

test("leaving and coming back shows left, then rejoined", async ({
  newPerson,
}) => {
  const { alice, bob, roomName } = await startChat(newPerson);

  await bob.reload();
  await expect(chatOf(alice)).toContainText("Bob left");

  await alice.getByRole("tab", { name: "Participants" }).click();
  await expect(alice.getByTitle("Left")).toHaveCount(1);
  await alice.getByRole("tab", { name: "Chat" }).click();

  await joinRoom(bob, "Bob", roomName);
  await expect(chatOf(alice)).toContainText("Bob rejoined");

  await sendMessage(bob, "back again");
  await expect(chatOf(alice)).toContainText("back again");
});

test("when the host leaves, the person who stays re-opens the room", async ({
  newPerson,
}) => {
  const { alice, bob, roomName } = await startChat(newPerson);
  const carol = await newPerson();
  await enterLobby(carol, "Carol");

  await alice.close();
  await expect(chatOf(bob)).toContainText("Alice left");
  await expect(lobbyListing(carol, roomName)).toBeVisible();

  await joinRoom(carol, "Carol", roomName);
  await expect(chatOf(carol)).toContainText("Bob joined");
  await sendMessage(carol, "hi bob");
  await expect(chatOf(bob)).toContainText("hi bob");
});
