import type { StateCreator } from "zustand";
import { chatDatabase } from "../libs/indexdb.ts";
import { createRoom, hostRoom, joinRoom } from "../libs/rtc.ts";
import type { ChatEvent } from "../types/events.ts";
import type { Room } from "../types/room.ts";
import type { ChatSlice } from "./chatSlice.ts";

export type RoomSlice = {
  name: string | null;
  peer: string | null;
  room: Room | null;
  join: (name: string, room: Room) => Promise<void>;
  create: (name: string, roomName: string) => Promise<void>;
};

const loadHistory = async (roomId: string): Promise<ChatEvent[]> => {
  try {
    const messages = await chatDatabase.load(roomId);
    return messages.map((message) => ({
      type: "sent",
      sessionId: roomId,
      payload: { message, metadata: {} },
    }));
  } catch (error) {
    console.error("Error loading saved messages:", error);
    return [];
  }
};

export const createRoomSlice: StateCreator<
  RoomSlice & ChatSlice,
  [],
  [],
  RoomSlice
> = (set) => ({
  name: null,
  peer: null,
  room: null,
  join: async (name, room) => {
    const events = await loadHistory(room.id);
    set({ name, room, events });
    try {
      await joinRoom(room.id);
    } catch (error) {
      console.error("Error joining the room:", error);
    }
  },
  create: async (name, roomName) => {
    try {
      const room = await createRoom(roomName);
      set({ name, room });
      await hostRoom(room.id);
    } catch (error) {
      console.error("Error creating the room:", error);
    }
  },
});
