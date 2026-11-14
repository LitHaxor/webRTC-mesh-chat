import { useEffect, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/index.ts";
import type { ChatEvent, RoomEvent } from "../types/events.ts";
import { getParticipants } from "../utils/participants.ts";
import MessageForm from "./MessageForm.tsx";
import MessageList from "./MessageList.tsx";
import ParticipantList from "./ParticipantList.tsx";

type Tab = "participants" | "chat";

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

const TabButton = ({ isActive, onClick, children }: TabButtonProps) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex-1 rounded py-2 font-semibold ${isActive ? "bg-white text-blue-600 shadow-sm" : ""}`}
    >
      {children}
    </button>
  );
};

const lastReceivedId = (events: (ChatEvent | RoomEvent)[], userId: string) => {
  const received = events.findLast(
    (event): event is ChatEvent =>
      "payload" in event && event.payload.message.userId !== userId,
  );
  return received?.payload.message.id;
};

const ChatRoom = () => {
  const {
    name,
    peers,
    events,
    userId,
    typing,
    seenId,
    sendingIds,
    send,
    edit,
    remove,
    notifyTyping,
    markRead,
  } = useStore(
    useShallow((state) => ({
      name: state.name,
      peers: state.peers,
      events: state.events,
      userId: state.userId,
      typing: state.typing,
      seenId: state.seenId,
      sendingIds: state.sendingIds,
      send: state.send,
      edit: state.edit,
      remove: state.remove,
      notifyTyping: state.notifyTyping,
      markRead: state.markRead,
    })),
  );
  const [tab, setTab] = useState<Tab>("chat");

  const connected = Object.values(peers);
  const participants = name ? getParticipants(name, connected, events) : [];
  const latestId = lastReceivedId(events, userId);

  useEffect(() => {
    if (!latestId || tab !== "chat") {
      return;
    }
    const markLatestRead = () => {
      if (document.visibilityState === "visible") {
        markRead(latestId);
      }
    };
    markLatestRead();
    document.addEventListener("visibilitychange", markLatestRead);
    return () =>
      document.removeEventListener("visibilitychange", markLatestRead);
  }, [latestId, tab, markRead]);

  return (
    <>
      <div
        role="tablist"
        className="mx-3 mt-3 flex rounded-md bg-neutral-200 p-1"
      >
        <TabButton
          isActive={tab === "participants"}
          onClick={() => setTab("participants")}
        >
          Participants ({participants.length})
        </TabButton>
        <TabButton isActive={tab === "chat"} onClick={() => setTab("chat")}>
          Chat
        </TabButton>
      </div>

      {tab === "participants" && (
        <ParticipantList participants={participants} you={name} />
      )}
      <div hidden={tab !== "chat"} className="flex min-h-0 flex-1 flex-col">
        <MessageList
          events={events}
          userId={userId}
          seenId={seenId}
          sendingIds={sendingIds}
          onEdit={edit}
          onDelete={remove}
        />
        {typing && (
          <p className="px-6 text-sm italic text-neutral-500">
            {typing} is typing…
          </p>
        )}
        <MessageForm onSend={send} onTyping={notifyTyping} />
      </div>
    </>
  );
};

export default ChatRoom;
