import type { StateCreator } from "zustand";
import { sendData } from "../libs/rtc.ts";
import type {
  ChatEvent,
  ReadEvent,
  RoomEvent,
  TypingEvent,
} from "../types/events.ts";
import type { Message } from "../types/message.ts";
import type { RoomSlice } from "./roomSlice.ts";

const userId = crypto.randomUUID();

const TYPING_INTERVAL_MS = 2000;
let lastTypingAt = 0;

const isMessage = (
  event: ChatEvent | RoomEvent,
  id: string,
): event is ChatEvent => {
  if (!("payload" in event)) {
    return false;
  }
  return event.payload.message.id === id;
};

const findMessage = (events: (ChatEvent | RoomEvent)[], id: string) => {
  const event = events.find((event) => isMessage(event, id));
  return event?.payload.message;
};

export type ChatSlice = {
  userId: string;
  events: (ChatEvent | RoomEvent)[];
  typing: string | null;
  seenId: string | null;
  addEvent: (event: ChatEvent | RoomEvent) => void;
  updateMessage: (message: Message) => boolean;
  send: (text: string) => boolean;
  edit: (id: string, text: string) => boolean;
  remove: (id: string) => boolean;
  notifyTyping: () => void;
  markRead: (id: string) => void;
};

export const createChatSlice: StateCreator<
  RoomSlice & ChatSlice,
  [],
  [],
  ChatSlice
> = (set, get) => {
  const changeOwnMessage = (
    type: "edited" | "deleted",
    id: string,
    changes: Partial<Message>,
  ) => {
    const { room, events, updateMessage } = get();
    const original = findMessage(events, id);
    if (!room || original?.userId !== userId) {
      return false;
    }
    if (original.deletedAt !== undefined) {
      return false;
    }
    const message: Message = { ...original, ...changes };
    const event: ChatEvent = {
      type,
      sessionId: room.id,
      payload: { message, metadata: {} },
    };

    if (!sendData(JSON.stringify(event))) {
      return false;
    }

    return updateMessage(message);
  };

  return {
    userId,
    events: [],
    typing: null,
    seenId: null,
    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
    updateMessage: (message) => {
      const original = findMessage(get().events, message.id);
      if (original?.userId !== message.userId) {
        return false;
      }
      if (original.deletedAt !== undefined) {
        return false;
      }

      set((state) => ({
        events: state.events.map((event) => {
          if (!isMessage(event, message.id)) {
            return event;
          }
          return { ...event, payload: { ...event.payload, message } };
        }),
      }));

      return true;
    },
    send: (text) => {
      const { name, room, addEvent } = get();
      if (!name || !room) {
        return false;
      }
      const message: Message = {
        id: crypto.randomUUID(),
        userId,
        userName: name,
        text,
        createdAt: Date.now(),
      };
      const event: ChatEvent = {
        type: "sent",
        sessionId: room.id,
        payload: { message, metadata: {} },
      };

      if (!sendData(JSON.stringify(event))) {
        return false;
      }

      addEvent(event);

      return true;
    },
    edit: (id, text) =>
      changeOwnMessage("edited", id, { text, editedAt: Date.now() }),
    remove: (id) =>
      changeOwnMessage("deleted", id, { text: "", deletedAt: Date.now() }),
    notifyTyping: () => {
      const { name } = get();
      if (!name) {
        return;
      }
      const now = Date.now();
      if (now - lastTypingAt < TYPING_INTERVAL_MS) {
        return;
      }
      lastTypingAt = now;
      const event: TypingEvent = { type: "typing", userName: name };
      sendData(JSON.stringify(event));
    },
    markRead: (id) => {
      const event: ReadEvent = { type: "read", messageId: id };
      sendData(JSON.stringify(event));
    },
  };
};
