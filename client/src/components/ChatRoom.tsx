import { useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../store/index.ts";
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
      onClick={onClick}
      className={`flex-1 rounded py-2 font-semibold ${isActive ? "bg-white text-blue-600 shadow-sm" : ""}`}
    >
      {children}
    </button>
  );
};

const ChatRoom = () => {
  const { name, peer, events, userId, send, edit, remove } = useStore(
    useShallow((state) => ({
      name: state.name,
      peer: state.peer,
      events: state.events,
      userId: state.userId,
      send: state.send,
      edit: state.edit,
      remove: state.remove,
    })),
  );
  const [tab, setTab] = useState<Tab>("chat");

  const participants = name ? getParticipants(name, peer, events) : [];

  return (
    <>
      <div className="mx-3 mt-3 flex rounded-md bg-neutral-200 p-1">
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
        <ParticipantList participants={participants} />
      )}
      <div hidden={tab !== "chat"} className="flex min-h-0 flex-1 flex-col">
        <MessageList
          events={events}
          userId={userId}
          onEdit={edit}
          onDelete={remove}
        />
        <MessageForm onSend={send} />
      </div>
    </>
  );
};

export default ChatRoom;
