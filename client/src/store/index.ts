import { create } from "zustand";
import { onClose, onMessage, onOpen, sendTo } from "../libs/rtc.ts";
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

const stopTypingOf = (userName: string) => {
  if (useStore.getState().typing === userName) {
    stopTyping();
  }
};

onOpen((peerId) => {
  const { name } = useStore.getState();
  if (name) {
    sendTo(peerId, JSON.stringify({ type: "joined", userName: name }));
  }
});

onMessage((peerId, data) => {
  const event: ChatEvent | RoomEvent | TypingEvent | ReadEvent =
    JSON.parse(data);
  const { events, addEvent, updateMessage, markSeen } = useStore.getState();

  switch (event.type) {
    case "joined": {
      const hasLeft = events.some(
        (e) => e.type === "left" && e.userName === event.userName,
      );
      useStore.setState((state) => ({
        peers: { ...state.peers, [peerId]: event.userName },
      }));
      addEvent({
        type: hasLeft ? "rejoined" : "joined",
        userName: event.userName,
        createdAt: Date.now(),
      });
      break;
    }
    case "sent":
      addEvent(event);
      stopTypingOf(event.payload.message.userName);
      break;
    case "edited":
    case "deleted":
      updateMessage(event.payload.message);
      break;
    case "typing":
      startTyping(event.userName);
      break;
    case "read":
      markSeen(event.messageId);
      break;
    default:
      console.warn("Ignoring unexpected event:", event);
  }
});

onClose((peerId) => {
  const { peers, addEvent } = useStore.getState();
  const { [peerId]: userName, ...others } = peers;
  if (!userName) {
    return;
  }
  addEvent({ type: "left", userName, createdAt: Date.now() });
  stopTypingOf(userName);
  useStore.setState({ peers: others });
});
