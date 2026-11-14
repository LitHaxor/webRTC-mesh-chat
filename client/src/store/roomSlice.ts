import type { StateCreator } from "zustand";
import { createRoom, hostRoom, joinRoom } from "../libs/rtc.ts";
import type { Room } from "../types/room.ts";
import type { ChatSlice } from "./chatSlice.ts";

export type RoomSlice = {
  name: string | null;
  peer: string | null;
  room: Room | null;
  join: (name: string, room: Room) => Promise<void>;
  create: (name: string, roomName: string) => Promise<void>;
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
    set({ name, room });
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
