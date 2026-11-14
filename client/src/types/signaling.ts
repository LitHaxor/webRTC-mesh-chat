import type { Room } from "./room.ts";

export type Signaling = {
  watchRooms: (onChange: (rooms: Room[]) => void) => () => void;
  createRoom: (name: string) => Promise<Room>;
  publishOffer: (
    roomId: string,
    offer: RTCSessionDescriptionInit,
    onAnswer: (answer: RTCSessionDescriptionInit) => void,
  ) => Promise<() => void>;
  fetchOffer: (roomId: string) => Promise<RTCSessionDescriptionInit>;
  publishAnswer: (
    roomId: string,
    answer: RTCSessionDescriptionInit,
  ) => Promise<void>;
};
