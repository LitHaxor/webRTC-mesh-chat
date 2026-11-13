import { create } from "zustand";
import { connect, onMessage, sendData } from "../libs/rtc.ts";
import type { Message } from "./message.ts";

type ChatStore = {
  name: string | null;
  messages: Message[];
  join: (name: string) => Promise<void>;
  send: (text: string) => boolean;
};

export const useChatStore = create<ChatStore>()((set, get) => ({
  name: null,
  messages: [],
  join: async (name) => {
    set({ name });
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting to the room:", error);
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
