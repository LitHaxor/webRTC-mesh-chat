import type { Message } from "./message.ts";

export type ChatEventType = "sent" | "edited" | "deleted";

export type RoomEventType = "joined" | "left" | "rejoined";

export interface ChatPayload<T = object> {
  message: Message;
  metadata: T;
}

export interface ChatEvent<T = object> {
  type: ChatEventType;
  sessionId: string;
  payload: ChatPayload<T>;
}

export interface RoomEvent {
  type: RoomEventType;
  userName: string;
  createdAt: number;
}

export interface TypingEvent {
  type: "typing";
  userName: string;
}

export interface ReadEvent {
  type: "read";
  messageId: string;
}
