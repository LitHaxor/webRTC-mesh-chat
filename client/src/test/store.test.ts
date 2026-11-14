import { beforeEach, expect, it, vi } from "vitest";
import { useStore } from "../store/index.ts";
import {
  connect,
  createRoom,
  onClose,
  onMessage,
  onOpen,
  sendData,
} from "../libs/rtc.ts";

vi.mock("../libs/rtc.ts", () => ({
  connect: vi.fn(),
  createRoom: vi.fn(),
  onClose: vi.fn(),
  onMessage: vi.fn(),
  onOpen: vi.fn(),
  sendData: vi.fn(),
}));

const receive = vi.mocked(onMessage).mock.calls[0][0];
const connectionOpens = vi.mocked(onOpen).mock.calls[0][0];
const peerDisconnects = vi.mocked(onClose).mock.calls[0][0];

const standup = { id: "room-1", name: "Standup" };

const sentByBob = {
  type: "sent",
  sessionId: "room-1",
  payload: {
    message: {
      id: "m1",
      userId: "bob",
      userName: "Bob",
      text: "hello",
      createdAt: 1,
    },
    metadata: {},
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  useStore.setState({
    name: "Alice",
    peer: null,
    room: standup,
    events: [],
  });
});

it("joins a room and connects to it", async () => {
  useStore.setState({ name: null, room: null });

  await useStore.getState().join("Bob", standup);

  expect(connect).toHaveBeenCalledWith("room-1");
  expect(useStore.getState()).toMatchObject({ name: "Bob", room: standup });
});

it("logs an error when connecting fails", async () => {
  vi.mocked(connect).mockRejectedValue(new Error("offline"));

  await useStore.getState().join("Bob", standup);

  expect(console.error).toHaveBeenCalled();
});

it("creates a room and joins it", async () => {
  useStore.setState({ name: null, room: null });
  vi.mocked(createRoom).mockResolvedValue(standup);

  await useStore.getState().create("Alice", "Standup");

  expect(createRoom).toHaveBeenCalledWith("Standup");
  expect(connect).toHaveBeenCalledWith("room-1");
  expect(useStore.getState().room).toEqual(standup);
});

it("stays in the lobby when creating a room fails", async () => {
  useStore.setState({ name: null, room: null });
  vi.mocked(createRoom).mockRejectedValue(new Error("offline"));

  await useStore.getState().create("Alice", "Standup");

  expect(useStore.getState().room).toBeNull();
  expect(console.error).toHaveBeenCalled();
});

it("adds a message once it is sent", () => {
  vi.mocked(sendData).mockReturnValue(true);

  expect(useStore.getState().send("hi")).toBe(true);
  expect(useStore.getState().events).toEqual([
    {
      type: "sent",
      sessionId: "room-1",
      payload: {
        message: {
          id: expect.any(String),
          userId: expect.any(String),
          userName: "Alice",
          text: "hi",
          createdAt: expect.any(Number),
        },
        metadata: {},
      },
    },
  ]);
});

it("keeps nothing when the message could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(false);

  expect(useStore.getState().send("hi")).toBe(false);
  expect(useStore.getState().events).toEqual([]);
});

it("does not send before joining a room", () => {
  useStore.setState({ room: null });

  expect(useStore.getState().send("hi")).toBe(false);
  expect(sendData).not.toHaveBeenCalled();
});

it("announces itself when the connection opens", () => {
  connectionOpens();

  expect(sendData).toHaveBeenCalledWith(
    JSON.stringify({ type: "joined", userName: "Alice" }),
  );
});

it("adds a message received from the other person", () => {
  receive(JSON.stringify(sentByBob));

  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("ignores unexpected events", () => {
  receive(JSON.stringify({ type: "left", userName: "Bob" }));

  expect(useStore.getState().events).toEqual([]);
  expect(console.warn).toHaveBeenCalled();
});

it("tracks when someone joins, leaves and rejoins", () => {
  receive(JSON.stringify({ type: "joined", userName: "Bob" }));
  peerDisconnects();
  receive(JSON.stringify({ type: "joined", userName: "Bob" }));

  expect(useStore.getState().events).toEqual([
    { type: "joined", userName: "Bob" },
    { type: "left", userName: "Bob" },
    { type: "rejoined", userName: "Bob" },
  ]);
});
