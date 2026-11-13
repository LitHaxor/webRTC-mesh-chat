import { beforeEach, expect, it, vi } from "vitest";
import { useChatStore } from "../chat/store.ts";
import { connect, createRoom, sendData } from "../libs/rtc.ts";

vi.mock("../libs/rtc.ts", () => ({
  connect: vi.fn(),
  createRoom: vi.fn(),
  onMessage: vi.fn(),
  sendData: vi.fn(),
}));

const standup = { id: "room-1", name: "Standup" };

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ name: "Alice", room: standup, messages: [] });
});

it("joins a room and connects to it", async () => {
  useChatStore.setState({ name: null, room: null });

  await useChatStore.getState().join("Bob", standup);

  expect(connect).toHaveBeenCalledWith("room-1");
  expect(useChatStore.getState()).toMatchObject({ name: "Bob", room: standup });
});

it("creates a room and joins it", async () => {
  useChatStore.setState({ name: null, room: null });
  vi.mocked(createRoom).mockResolvedValue(standup);

  await useChatStore.getState().create("Alice", "Standup");

  expect(createRoom).toHaveBeenCalledWith("Standup");
  expect(connect).toHaveBeenCalledWith("room-1");
  expect(useChatStore.getState().room).toEqual(standup);
});

it("adds a message once it is sent", () => {
  vi.mocked(sendData).mockReturnValue(true);

  expect(useChatStore.getState().send("hi")).toBe(true);
  expect(useChatStore.getState().messages).toEqual([
    { name: "Alice", text: "hi" },
  ]);
});

it("keeps nothing when the message could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(false);

  expect(useChatStore.getState().send("hi")).toBe(false);
  expect(useChatStore.getState().messages).toEqual([]);
});
