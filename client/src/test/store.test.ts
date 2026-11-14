import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { chatDatabase } from "../libs/indexdb.ts";
import { useStore } from "../store/index.ts";
import type { ChatEvent } from "../types/events.ts";
import {
  createRoom,
  joinRoom,
  onClose,
  onMessage,
  onOpen,
  sendData,
  sendTo,
} from "../libs/rtc/index.ts";

vi.mock("../libs/indexdb.ts", () => ({
  chatDatabase: { save: vi.fn(), load: vi.fn() },
}));

vi.mock("../libs/rtc/index.ts", () => ({
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  onClose: vi.fn(),
  onMessage: vi.fn(),
  onOpen: vi.fn(),
  sendData: vi.fn(),
  sendTo: vi.fn(),
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
  vi.mocked(chatDatabase.save).mockResolvedValue();
  vi.mocked(chatDatabase.load).mockResolvedValue([]);
  useStore.setState({
    name: "Alice",
    peers: {},
    room: standup,
    events: [],
    typing: null,
    seenId: null,
    sendingIds: [],
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

it("creates a room", async () => {
  useStore.setState({ name: null, room: null });
  vi.mocked(createRoom).mockResolvedValue(standup);

  await useStore.getState().create("Alice", "Standup");

  expect(createRoom).toHaveBeenCalledWith("Standup");
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
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));

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
  vi.mocked(sendData).mockReturnValue(null);

  expect(useStore.getState().send("hi")).toBe(false);
  expect(useStore.getState().events).toEqual([]);
});

it("does not send before joining a room", () => {
  useStore.setState({ room: null });

  expect(useStore.getState().send("hi")).toBe(false);
  expect(sendData).not.toHaveBeenCalled();
});

it("announces itself to each person it connects to", () => {
  connectionOpens("bob");

  expect(sendTo).toHaveBeenCalledWith(
    "bob",
    JSON.stringify({ type: "joined", userName: "Alice" }),
  );
});

it("adds a message received from the other person", () => {
  receive("bob", JSON.stringify(sentByBob));

  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("ignores unexpected events", () => {
  receive("bob", JSON.stringify({ type: "left", userName: "Bob" }));

  expect(useStore.getState().events).toEqual([]);
  expect(console.warn).toHaveBeenCalled();
});

it("tracks when someone joins, leaves and rejoins", () => {
  receive("bob", JSON.stringify({ type: "joined", userName: "Bob" }));
  peerDisconnects("bob");
  receive("bob", JSON.stringify({ type: "joined", userName: "Bob" }));

  expect(useStore.getState().events).toEqual([
    { type: "joined", userName: "Bob", createdAt: expect.any(Number) },
    { type: "left", userName: "Bob", createdAt: expect.any(Number) },
    { type: "rejoined", userName: "Bob", createdAt: expect.any(Number) },
  ]);
});

it("tracks several people at once", () => {
  receive("bob", JSON.stringify({ type: "joined", userName: "Bob" }));
  receive("carol", JSON.stringify({ type: "joined", userName: "Carol" }));
  expect(useStore.getState().peers).toEqual({ bob: "Bob", carol: "Carol" });

  peerDisconnects("bob");

  expect(useStore.getState().peers).toEqual({ carol: "Carol" });
  expect(useStore.getState().events.at(-1)).toMatchObject({
    type: "left",
    userName: "Bob",
  });
});

it("ignores a connection that closes before saying who it was", () => {
  peerDisconnects("stranger");

  expect(useStore.getState().events).toEqual([]);
});

it("edits your own message and tells the other person", () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
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
  receive("bob", JSON.stringify(sentByBob));

  expect(useStore.getState().edit("m1", "changed")).toBe(false);
  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("keeps your message unchanged when the edit could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  vi.mocked(sendData).mockReturnValue(null);

  expect(useStore.getState().edit(sent.payload.message.id, "hello")).toBe(
    false,
  );
  expect(useStore.getState().events).toEqual([sent]);
});

it("applies an edit from the other person to the right message", () => {
  receive("bob", JSON.stringify({ type: "joined", userName: "Bob" }));
  receive("bob", JSON.stringify(sentByBob));
  receive(
    "bob",
    JSON.stringify(editedByBob({ text: "hello again", editedAt: 2 })),
  );

  const [joined, message] = useStore.getState().events;
  expect(joined).toMatchObject({ type: "joined", userName: "Bob" });
  expect((message as ChatEvent).payload.message).toMatchObject({
    text: "hello again",
    editedAt: 2,
  });
});

it("ignores an edit that claims a different author", () => {
  receive("bob", JSON.stringify(sentByBob));
  receive(
    "bob",
    JSON.stringify(editedByBob({ userId: "mallory", text: "hacked" })),
  );

  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("deletes your own message and tells the other person", () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
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
  receive("bob", JSON.stringify(sentByBob));

  expect(useStore.getState().remove("m1")).toBe(false);
  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("applies a delete from the other person", () => {
  receive("bob", JSON.stringify(sentByBob));
  receive("bob", JSON.stringify(deletedByBob));

  const [event] = useStore.getState().events as ChatEvent[];
  expect(event.payload.message).toMatchObject({ text: "", deletedAt: 3 });
});

it("cannot edit a deleted message", () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  useStore.getState().remove(sent.payload.message.id);

  expect(useStore.getState().edit(sent.payload.message.id, "back")).toBe(false);
});

it("ignores an edit to a message the other person deleted", () => {
  receive("bob", JSON.stringify(sentByBob));
  receive("bob", JSON.stringify(deletedByBob));
  receive("bob", JSON.stringify(editedByBob({ text: "back again" })));

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

  receive("bob", JSON.stringify({ type: "typing", userName: "Bob" }));
  expect(useStore.getState().typing).toBe("Bob");

  vi.advanceTimersByTime(3000);
  expect(useStore.getState().typing).toBeNull();
});

it("stops showing typing once their message arrives", () => {
  receive("bob", JSON.stringify({ type: "typing", userName: "Bob" }));
  receive("bob", JSON.stringify(sentByBob));

  expect(useStore.getState().typing).toBeNull();
});

it("keeps showing typing when someone else's message arrives", () => {
  receive("carol", JSON.stringify({ type: "typing", userName: "Carol" }));
  receive("bob", JSON.stringify(sentByBob));

  expect(useStore.getState().typing).toBe("Carol");
});

it("sends a read receipt for a message", () => {
  useStore.getState().markRead("m1");

  expect(sendData).toHaveBeenCalledWith(
    JSON.stringify({ type: "read", messageId: "m1" }),
  );
});

const sendOwn = (text: string) => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
  useStore.getState().send(text);
  const sent = useStore.getState().events.at(-1) as ChatEvent;
  return sent.payload.message.id;
};

it("remembers which of your messages someone has seen", () => {
  const id = sendOwn("hi");

  receive("bob", JSON.stringify({ type: "read", messageId: id }));

  expect(useStore.getState().seenId).toBe(id);
});

it("marks your latest message as seen when a later one from someone else is read", () => {
  const id = sendOwn("hi");
  receive("bob", JSON.stringify(sentByBob));

  receive("carol", JSON.stringify({ type: "read", messageId: "m1" }));

  expect(useStore.getState().seenId).toBe(id);
});

it("does not move seen backwards when a slower reader catches up", () => {
  const first = sendOwn("one");
  const second = sendOwn("two");

  receive("bob", JSON.stringify({ type: "read", messageId: second }));
  receive("carol", JSON.stringify({ type: "read", messageId: first }));

  expect(useStore.getState().seenId).toBe(second);
});

it("ignores a read receipt for a message it does not have", () => {
  receive("bob", JSON.stringify({ type: "read", messageId: "unknown" }));

  expect(useStore.getState().seenId).toBeNull();
});

it("saves a message you send", () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(true));
  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];

  expect(chatDatabase.save).toHaveBeenCalledWith(
    "room-1",
    sent.payload.message,
  );
});

it("does not save a message that could not be sent", () => {
  vi.mocked(sendData).mockReturnValue(null);
  useStore.getState().send("hi");

  expect(chatDatabase.save).not.toHaveBeenCalled();
});

it("saves a message you receive", () => {
  receive("bob", JSON.stringify(sentByBob));

  expect(chatDatabase.save).toHaveBeenCalledWith(
    "room-1",
    sentByBob.payload.message,
  );
});

it("saves the newest version of an edited, then deleted message", () => {
  receive("bob", JSON.stringify(sentByBob));
  receive(
    "bob",
    JSON.stringify(editedByBob({ text: "hello again", editedAt: 2 })),
  );
  receive("bob", JSON.stringify(deletedByBob));

  expect(chatDatabase.save).toHaveBeenCalledTimes(3);
  expect(chatDatabase.save).toHaveBeenLastCalledWith(
    "room-1",
    deletedByBob.payload.message,
  );
});

it("does not save an edit that claims a different author", () => {
  receive("bob", JSON.stringify(sentByBob));
  receive(
    "bob",
    JSON.stringify(editedByBob({ userId: "mallory", text: "hacked" })),
  );

  expect(chatDatabase.save).toHaveBeenCalledTimes(1);
});

it("loads the room's saved messages when you join", async () => {
  useStore.setState({ name: null, room: null });
  vi.mocked(chatDatabase.load).mockResolvedValue([sentByBob.payload.message]);

  await useStore.getState().join("Alice", standup);

  expect(chatDatabase.load).toHaveBeenCalledWith("room-1");
  expect(useStore.getState().events).toEqual([sentByBob]);
  expect(joinRoom).toHaveBeenCalledWith("room-1");
});

it("joins with no history when saved messages cannot be loaded", async () => {
  vi.mocked(chatDatabase.load).mockRejectedValue(new Error("blocked"));

  await useStore.getState().join("Alice", standup);

  expect(useStore.getState().events).toEqual([]);
  expect(joinRoom).toHaveBeenCalledWith("room-1");
  expect(console.error).toHaveBeenCalled();
});

it("keeps the message on screen when it cannot be saved", async () => {
  vi.mocked(chatDatabase.save).mockRejectedValue(new Error("quota"));

  receive("bob", JSON.stringify(sentByBob));

  await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
  expect(useStore.getState().events).toEqual([sentByBob]);
});

it("shows a message as sending until it is encrypted and sent", async () => {
  const sending = Promise.withResolvers<boolean>();
  vi.mocked(sendData).mockReturnValue(sending.promise);

  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  expect(useStore.getState().sendingIds).toEqual([sent.payload.message.id]);

  sending.resolve(true);

  await vi.waitFor(() => expect(useStore.getState().sendingIds).toEqual([]));
});

it("keeps a message marked as sending when it could not be sent", async () => {
  vi.mocked(sendData).mockReturnValue(Promise.resolve(false));

  useStore.getState().send("hi");
  const [sent] = useStore.getState().events as ChatEvent[];
  await Promise.resolve();

  expect(useStore.getState().sendingIds).toEqual([sent.payload.message.id]);
});
