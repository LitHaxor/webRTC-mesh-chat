import { X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store/index.ts";
import Lobby from "./components/Lobby.tsx";
import MessageForm from "./components/MessageForm.tsx";
import MessageList from "./components/MessageList.tsx";
import ParticipantList from "./components/ParticipantList.tsx";
import { getParticipants } from "./utils/participants.ts";

const App = () => {
  const name = useStore((state) => state.name);
  const peer = useStore((state) => state.peer);
  const room = useStore((state) => state.room);
  const events = useStore((state) => state.events);
  const join = useStore((state) => state.join);
  const create = useStore((state) => state.create);
  const send = useStore((state) => state.send);
  const edit = useStore((state) => state.edit);
  const userId = useStore((state) => state.userId);
  const [tab, setTab] = useState<"participants" | "chat">("chat");

  const participants = name ? getParticipants(name, peer, events) : [];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-200 p-4 text-neutral-800">
      <div className="flex h-160 max-h-full w-full max-w-sm flex-col rounded-lg bg-white shadow-lg">
        <header className="flex items-center justify-between border-b border-neutral-300 px-6 py-5">
          <h1 className="truncate text-lg font-semibold">
            {room ? room.name : "Chat rooms"}
          </h1>
          {room && (
            <button
              type="button"
              aria-label="Leave room"
              onClick={() => window.location.reload()}
              className="text-neutral-600 hover:text-neutral-900"
            >
              <X className="size-6" />
            </button>
          )}
        </header>

        {room ? (
          <>
            <div className="mx-3 mt-3 flex rounded-md bg-neutral-200 p-1">
              <button
                type="button"
                onClick={() => setTab("participants")}
                className={`flex-1 rounded py-2 font-semibold ${tab === "participants" ? "bg-white text-blue-600 shadow-sm" : ""}`}
              >
                Participants ({participants.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={`flex-1 rounded py-2 font-semibold ${tab === "chat" ? "bg-white text-blue-600 shadow-sm" : ""}`}
              >
                Chat
              </button>
            </div>

            {tab === "participants" && (
              <ParticipantList participants={participants} />
            )}
            <div hidden={tab !== "chat"} className="flex min-h-0 flex-1 flex-col">
              <MessageList events={events} userId={userId} onEdit={edit} />
              <MessageForm onSend={send} />
            </div>
          </>
        ) : (
          <Lobby onJoin={join} onCreate={create} />
        )}
      </div>
    </main>
  );
};

export default App;
