import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useStore } from "../store/index.ts";
import type { ChatEvent } from "../types/events.ts";
import {
  createRoom,
  hostRoom,
  joinRoom,
  onClose,
  onMessage,
  onOpen,
  sendData,
} from "../libs/rtc.ts";

vi.mock("../libs/rtc.ts", () => ({
  createRoom: vi.fn(),
  hostRoom: vi.fn(),
  joinRoom: vi.fn(),
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

const editedByBob = (changes: object) => ({
  type: "edited",
  sessionId: "room-1",
  payload: {
    message: { ...sentByBob.payload.message, ...changes },
    metadata: {},
  },
});

const deletedByBob = {
  type: "deleted",
  sessionId: "room-1",
  payload: {
    message: { ...sentByBob.payload.message, text: "", deletedAt: 3 },
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
    typing: null,
    seenId: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

it("joins a room", async () => {
  useStore.setState({ name: null, room: null });

  await useStore.getState().join("Bob", standup);

  expect(joinRoom).toHaveBeenCalledWith("room-1");
  expect(useStore.getState()).toMatchObject({ name: "Bob", room: standup });
});

it("logs an error when joining fails", async () => {
  vi.mocked(joinRoom).mockRejectedValue(new Error("Room is not available"));

  await useStore.getState().join("Bob", standup);

  expect(console.error).toHaveBeenCalled();
});

it("creates a room and hosts it", async () => {
  useStore.setState({ name: null, room: null });
  vi.mocked(createRoom).mockResolvedValue(standup);

  await useStore.getState().create("Alice", "Standup");

  expect(createRoom).toHaveBeenCalledWith("Standup");
  expect(hostRoom).toHaveBeenCalledWith("room-1");
  expect(useStore.getState()).toMatchObject({ name: "Alice", room: standup });
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
    { type: "joined", userName: "Bob", createdAt: expect.any(Number) },
    { type: "left", userName: "Bob", createdAt: expect.any(Number) },
    { type: "rejoined", userName: "Bob", createdAt: expect.any(Number) },
  ]);
});

it("edits your own message and tells the other person", () => {
  vi.mocked(sendData).mockReturnValue(true);
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  const { id, createdAt } = sent.payload.message;

  expect(useStore.getState().edit(id, "hello")).toBe(true);

  const [edited] = useStore.getState().events as ChatEvent[];
  expect(edited.payload.message).toMatchObject({
    id,
    text: "hello",
    createdAt,
    editedAt: expect.any(Number),
  });
  expect(sendData).toHaveBeenLastCalledWith(
    expect.stringContaining('"type":"edited"'),
  );
});

it("cannot edit someone else's message", () => {
  receive(JSON.stringify(sentByBob));

  expect(useStore.getState().edit("m1", "changed")).toBe(false);
  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("keeps your message unchanged when the edit could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(true);
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  vi.mocked(sendData).mockReturnValue(false);

  expect(useStore.getState().edit(sent.payload.message.id, "hello")).toBe(
    false,
  );
  expect(useStore.getState().events).toEqual([sent]);
});

it("applies an edit from the other person to the right message", () => {
  receive(JSON.stringify({ type: "joined", userName: "Bob" }));
  receive(JSON.stringify(sentByBob));
  receive(JSON.stringify(editedByBob({ text: "hello again", editedAt: 2 })));

  const [joined, message] = useStore.getState().events;
  expect(joined).toMatchObject({ type: "joined", userName: "Bob" });
  expect((message as ChatEvent).payload.message).toMatchObject({
    text: "hello again",
    editedAt: 2,
  });
});

it("ignores an edit that claims a different author", () => {
  receive(JSON.stringify(sentByBob));
  receive(JSON.stringify(editedByBob({ userId: "mallory", text: "hacked" })));

  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("deletes your own message and tells the other person", () => {
  vi.mocked(sendData).mockReturnValue(true);
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];

  expect(useStore.getState().remove(sent.payload.message.id)).toBe(true);

  const [deleted] = useStore.getState().events as ChatEvent[];
  expect(deleted.payload.message).toMatchObject({
    text: "",
    deletedAt: expect.any(Number),
  });
  expect(sendData).toHaveBeenLastCalledWith(
    expect.stringContaining('"type":"deleted"'),
  );
});

it("cannot delete someone else's message", () => {
  receive(JSON.stringify(sentByBob));

  expect(useStore.getState().remove("m1")).toBe(false);
  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("applies a delete from the other person", () => {
  receive(JSON.stringify(sentByBob));
  receive(JSON.stringify(deletedByBob));

  const [event] = useStore.getState().events as ChatEvent[];
  expect(event.payload.message).toMatchObject({ text: "", deletedAt: 3 });
});

it("cannot edit a deleted message", () => {
  vi.mocked(sendData).mockReturnValue(true);
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  useStore.getState().remove(sent.payload.message.id);

  expect(useStore.getState().edit(sent.payload.message.id, "back")).toBe(false);
});

it("ignores an edit to a message the other person deleted", () => {
  receive(JSON.stringify(sentByBob));
  receive(JSON.stringify(deletedByBob));
  receive(JSON.stringify(editedByBob({ text: "back again" })));

  const [event] = useStore.getState().events as ChatEvent[];
  expect(event.payload.message.text).toBe("");
});

it("tells the other person you are typing, at most every two seconds", () => {
  vi.useFakeTimers();
  const { notifyTyping } = useStore.getState();

  notifyTyping();
  notifyTyping();
  vi.advanceTimersByTime(2000);
  notifyTyping();

  expect(sendData).toHaveBeenCalledTimes(2);
  expect(sendData).toHaveBeenCalledWith(
    JSON.stringify({ type: "typing", userName: "Alice" }),
  );
});

it("shows who is typing until a few seconds pass", () => {
  vi.useFakeTimers();

  receive(JSON.stringify({ type: "typing", userName: "Bob" }));
  expect(useStore.getState().typing).toBe("Bob");

  vi.advanceTimersByTime(3000);
  expect(useStore.getState().typing).toBeNull();
});

it("stops showing typing once their message arrives", () => {
  receive(JSON.stringify({ type: "typing", userName: "Bob" }));
  receive(JSON.stringify(sentByBob));

  expect(useStore.getState().typing).toBeNull();
});

it("sends a read receipt for a message", () => {
  useStore.getState().markRead("m1");

  expect(sendData).toHaveBeenCalledWith(
    JSON.stringify({ type: "read", messageId: "m1" }),
  );
});

it("remembers which of your messages the other person has seen", () => {
  receive(JSON.stringify({ type: "read", messageId: "m1" }));

  expect(useStore.getState().seenId).toBe("m1");
});
