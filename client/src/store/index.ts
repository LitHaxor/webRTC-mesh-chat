import { create } from "zustand";
import { onClose, onMessage, onOpen, sendData } from "../libs/rtc.ts";
import type {
  ChatEvent,
  ReadEvent,
  RoomEvent,
  TypingEvent,
} from "../types/events.ts";
import { createChatSlice, type ChatSlice } from "./chatSlice.ts";
import { createRoomSlice, type RoomSlice } from "./roomSlice.ts";

export const useStore = create<RoomSlice & ChatSlice>()((...args) => ({
  ...createRoomSlice(...args),
  ...createChatSlice(...args),
}));

const TYPING_TIMEOUT_MS = 3000;
let typingTimer: ReturnType<typeof setTimeout> | undefined;

const stopTyping = () => {
  clearTimeout(typingTimer);
  useStore.setState({ typing: null });
};

const startTyping = (userName: string) => {
  clearTimeout(typingTimer);
  useStore.setState({ typing: userName });
  typingTimer = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
};

onOpen(() => {
  const { name } = useStore.getState();
  if (name) {
    sendData(JSON.stringify({ type: "joined", userName: name }));
  }
});

onMessage((data) => {
  const event: ChatEvent | RoomEvent | TypingEvent | ReadEvent =
    JSON.parse(data);
  const { events, addEvent, updateMessage } = useStore.getState();

  switch (event.type) {
    case "joined": {
      const hasLeft = events.some(
        (e) => e.type === "left" && e.userName === event.userName,
      );
      useStore.setState({ peer: event.userName });
      addEvent({
        type: hasLeft ? "rejoined" : "joined",
        userName: event.userName,
        createdAt: Date.now(),
      });
      break;
    }
    case "sent":
      addEvent(event);
      stopTyping();
      break;
    case "edited":
    case "deleted":
      updateMessage(event.payload.message);
      break;
    case "typing":
      startTyping(event.userName);
      break;
    case "read":
      useStore.setState({ seenId: event.messageId });
      break;
    default:
      console.warn("Ignoring unexpected event:", event);
  }
});

onClose(() => {
  const { peer, addEvent } = useStore.getState();
  if (peer) {
    addEvent({ type: "left", userName: peer, createdAt: Date.now() });
  }
  stopTyping();
  useStore.setState({ peer: null });
});
