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
    <main className="flex min-h-dvh items-center justify-center bg-neutral-200 text-neutral-800 sm:p-4">
      <div className="flex h-dvh w-full flex-col bg-white sm:h-160 sm:max-h-[calc(100dvh-2rem)] sm:max-w-sm sm:rounded-lg sm:shadow-lg">
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
