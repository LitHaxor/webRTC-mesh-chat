import type { StateCreator } from "zustand";
import { sendData } from "../libs/rtc.ts";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import type { Message } from "../types/message.ts";
import type { RoomSlice } from "./roomSlice.ts";

const userId = crypto.randomUUID();

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
  addEvent: (event: ChatEvent | RoomEvent) => void;
  updateMessage: (message: Message) => boolean;
  send: (text: string) => boolean;
  edit: (id: string, text: string) => boolean;
};

export const createChatSlice: StateCreator<
  RoomSlice & ChatSlice,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  userId,
  events: [],
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateMessage: (message) => {
    const original = findMessage(get().events, message.id);
    if (original?.userId !== message.userId) {
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
  edit: (id, text) => {
    const { room, events, updateMessage } = get();
    const original = findMessage(events, id);
    if (!room || original?.userId !== userId) {
      return false;
    }
    const message: Message = { ...original, text, editedAt: Date.now() };
    const event: ChatEvent = {
      type: "edited",
      sessionId: room.id,
      payload: { message, metadata: {} },
    };

    if (!sendData(JSON.stringify(event))) {
      return false;
    }

    return updateMessage(message);
  },
});
