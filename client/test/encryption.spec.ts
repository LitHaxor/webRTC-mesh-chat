import {
  chatOf,
  createRoom,
  expect,
  joinRoom,
  messageRow,
  recordSentFrames,
  sendMessage,
  sentFrames,
  test,
  uniqueRoomName,
} from "./helpers.ts";

test("only public keys and encrypted frames cross the data channel", async ({
  newPerson,
}) => {
  const alice = await newPerson();
  const bob = await newPerson();
  await recordSentFrames(alice);
  await recordSentFrames(bob);
  const roomName = uniqueRoomName();
  await createRoom(alice, "Alice", roomName);
  await joinRoom(bob, "Bob", roomName);
  await expect(chatOf(alice)).toContainText("Bob joined");

  await sendMessage(alice, "the launch code is 1234");
  await expect(messageRow(bob, "the launch code is 1234")).toBeVisible();
  await sendMessage(bob, "copy that");
  await expect(messageRow(alice, "copy that")).toBeVisible();

  const frames = [...(await sentFrames(alice)), ...(await sentFrames(bob))];
  const wire = frames.join("\n");
  expect(wire).not.toContain("launch code");
  expect(wire).not.toContain("copy that");
  expect(wire).not.toContain("Alice");
  expect(wire).not.toContain("Bob");
  const types = new Set(frames.map((frame) => JSON.parse(frame).type));
  expect(types).toEqual(new Set(["key", "encrypted"]));
});
