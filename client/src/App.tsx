import { useStore } from "./store/index.ts";
import ChatRoom from "./components/ChatRoom.tsx";
import Header from "./components/Header.tsx";
import Lobby from "./components/Lobby.tsx";

const leaveRoom = () => window.location.reload();

const App = () => {
  const room = useStore((state) => state.room);
  const join = useStore((state) => state.join);
  const create = useStore((state) => state.create);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-200 p-4 text-neutral-800">
      <div className="flex h-160 max-h-full w-full max-w-sm flex-col rounded-lg bg-white shadow-lg">
        {room && (
          <>
            <Header title={room.name} onLeave={leaveRoom} />
            <ChatRoom />
          </>
        )}
        {!room && (
          <>
            <Header title="Chat rooms" />
            <Lobby onJoin={join} onCreate={create} />
          </>
        )}
      </div>
    </main>
  );
};

export default App;
