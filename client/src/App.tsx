import { X } from "lucide-react";
import { useStore } from "./store/index.ts";
import Lobby from "./components/Lobby.tsx";
import MessageForm from "./components/MessageForm.tsx";
import MessageList from "./components/MessageList.tsx";

const App = () => {
  const room = useStore((state) => state.room);
  const events = useStore((state) => state.events);
  const join = useStore((state) => state.join);
  const create = useStore((state) => state.create);
  const send = useStore((state) => state.send);

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
            <MessageList events={events} />
            <MessageForm onSend={send} />
          </>
        ) : (
          <Lobby onJoin={join} onCreate={create} />
        )}
      </div>
    </main>
  );
};

export default App;
