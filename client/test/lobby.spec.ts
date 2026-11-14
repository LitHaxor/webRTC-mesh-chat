import {
  createRoom,
  enterLobby,
  expect,
  joinRoom,
  lobbyListing,
  test,
  uniqueRoomName,
} from "./helpers.ts";

test("Join and Create stay disabled until you enter a name", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Enter your name to join or create a room"),
  ).toBeVisible();

  await page.getByPlaceholder("New room name").fill("Standup");
  await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();

  await page.getByPlaceholder("Your name").fill("Alice");
  await expect(page.getByRole("button", { name: "Create" })).toBeEnabled();
});

test("a new room is listed in the lobby until someone joins it", async ({
  newPerson,
}) => {
  const roomName = uniqueRoomName();
  const alice = await newPerson();
  const bob = await newPerson();
  const carol = await newPerson();

  await createRoom(alice, "Alice", roomName);
  await enterLobby(carol, "Carol");
  await expect(lobbyListing(carol, roomName)).toBeVisible();

  await joinRoom(bob, "Bob", roomName);
  await expect(lobbyListing(carol, roomName)).toHaveCount(0);
});

test("a room disappears from the lobby when its host leaves", async ({
  newPerson,
}) => {
  const roomName = uniqueRoomName();
  const alice = await newPerson();
  const carol = await newPerson();

  await createRoom(alice, "Alice", roomName);
  await enterLobby(carol, "Carol");
  await expect(lobbyListing(carol, roomName)).toBeVisible();

  await alice.close();
  await expect(lobbyListing(carol, roomName)).toHaveCount(0);
});
