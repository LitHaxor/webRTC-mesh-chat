import type { StateCreator } from "zustand";
import { sendData } from "../libs/rtc.ts";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import type { Message } from "../types/message.ts";
import type { RoomSlice } from "./roomSlice.ts";

const userId = crypto.randomUUID();

export type ChatSlice = {
  events: (ChatEvent | RoomEvent)[];
  addEvent: (event: ChatEvent | RoomEvent) => void;
  send: (text: string) => boolean;
};

export const createChatSlice: StateCreator<
  RoomSlice & ChatSlice,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  events: [],
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
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
});
