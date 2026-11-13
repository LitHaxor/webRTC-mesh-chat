import { create } from "zustand";
import { connect, createRoom, onMessage, sendData } from "../libs/rtc.ts";
import type { Message } from "./message.ts";
import type { Room } from "./room.ts";

type ChatStore = {
  name: string | null;
  room: Room | null;
  messages: Message[];
  join: (name: string, room: Room) => Promise<void>;
  create: (name: string, roomName: string) => Promise<void>;
  send: (text: string) => boolean;
};

export const useChatStore = create<ChatStore>()((set, get) => ({
  name: null,
  room: null,
  messages: [],
  join: async (name, room) => {
    set({ name, room });
    try {
      await connect(room.id);
    } catch (error) {
      console.error("Error connecting to the room:", error);
    }
  },
  create: async (name, roomName) => {
    try {
      await get().join(name, await createRoom(roomName));
    } catch (error) {
      console.error("Error creating the room:", error);
    }
  },
  send: (text) => {
    const { name } = get();
    if (!name) {
      return false;
    }
    const message: Message = { name, text };

    if (!sendData(JSON.stringify(message))) {
      return false;
    }

    set((state) => ({ messages: [...state.messages, message] }));

    return true;
  },
}));

onMessage((data) =>
  useChatStore.setState((state) => ({
    messages: [...state.messages, JSON.parse(data)],
  })),
);
