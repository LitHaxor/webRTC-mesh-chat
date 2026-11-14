import {
  NEWEST_SEEDED,
  chatOf,
  createRoom,
  enterLobby,
  expect,
  fakeConversation,
  joinRoom,
  lobbyListing,
  messageRow,
  ownUserId,
  seedConversation,
  sendMessage,
  test,
  trackRoomIds,
  uniqueRoomName,
} from "./helpers.ts";

const COUNT = 10_000;

test("a room with 10,000 saved messages from six people opens, and still sends and receives", async ({
  newPerson,
}) => {
  test.slow();
  const roomName = uniqueRoomName();
  const alice = await newPerson();
  const bob = await newPerson();
  const roomIds = trackRoomIds(bob);
  await createRoom(alice, "Alice", roomName);
  await enterLobby(bob, "Bob");
  await expect(lobbyListing(bob, roomName)).toBeVisible();
  const history = fakeConversation(COUNT, await ownUserId(bob));
  await seedConversation(bob, roomIds.get(roomName) ?? "", history);

  await joinRoom(bob, "Bob", roomName);

  await expect(messageRow(bob, NEWEST_SEEDED)).toBeInViewport({
    timeout: 30_000,
  });
  await expect(chatOf(alice)).toContainText("Bob joined", { timeout: 30_000 });

  await sendMessage(alice, "still with us?");
  await expect(messageRow(bob, "still with us?")).toBeInViewport({
    timeout: 30_000,
  });
  await sendMessage(bob, "yes, all ten thousand of us");
  await expect(messageRow(alice, "yes, all ten thousand")).toBeVisible({
    timeout: 30_000,
  });
});
