import {
  createRoom,
  enterLobby,
  expect,
  joinRoom,
  lobbyListing,
  test,
  uniqueRoomName,
} from "./helpers.ts";

test("Create turns blue once the room has a name, and asks for yours first", async ({
  page,
}) => {
  await page.goto("/");
  const create = page.getByRole("button", { name: "Create" });
  await expect(
    page.getByText("Enter your name to join or create a room"),
  ).toBeVisible();
  await expect(create).toBeDisabled();

  await page.getByPlaceholder("New room name").fill("Standup");
  await expect(create).toBeEnabled();

  await create.click();
  await expect(page.getByPlaceholder("Your name")).toBeFocused();
  await expect(page.getByRole("heading", { name: "Chat rooms" })).toBeVisible();
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

test("on a phone the app fills the whole screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const box = await page.locator("main > div").boundingBox();

  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
});
