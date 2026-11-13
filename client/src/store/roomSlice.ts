import type { StateCreator } from "zustand";
import { connect, createRoom } from "../libs/rtc.ts";
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
> = (set, get) => ({
  name: null,
  peer: null,
  room: null,
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
});
