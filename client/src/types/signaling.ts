import type { Room } from "./room.ts";

export type SignalHandler = (
  peerId: string,
  sdp: RTCSessionDescriptionInit,
) => void;

export type Signaling = {
  watchRooms: (onChange: (rooms: Room[]) => void) => () => void;
  createRoom: (name: string) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<string[]>;
  sendOffer: (
    roomId: string,
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ) => Promise<void>;
  sendAnswer: (
    roomId: string,
    peerId: string,
    answer: RTCSessionDescriptionInit,
  ) => Promise<void>;
  onOffer: (handler: SignalHandler) => void;
  onAnswer: (handler: SignalHandler) => void;
};
