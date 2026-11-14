import { create } from "zustand";
import { onClose, onMessage, onOpen, sendData } from "../libs/rtc.ts";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { createChatSlice, type ChatSlice } from "./chatSlice.ts";
import { createRoomSlice, type RoomSlice } from "./roomSlice.ts";

export const useStore = create<RoomSlice & ChatSlice>()((...args) => ({
  ...createRoomSlice(...args),
  ...createChatSlice(...args),
}));

onOpen(() => {
  const { name } = useStore.getState();
  if (name) {
    sendData(JSON.stringify({ type: "joined", userName: name }));
  }
});

onMessage((data) => {
  const event: ChatEvent | RoomEvent = JSON.parse(data);
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
      break;
    case "edited":
    case "deleted":
      updateMessage(event.payload.message);
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
  useStore.setState({ peer: null });
});
