import { useChatStore } from "./chat/store.ts";
import JoinForm from "./components/JoinForm.tsx";
import MessageForm from "./components/MessageForm.tsx";
import MessageList from "./components/MessageList.tsx";

const App = () => {
  const name = useChatStore((state) => state.name);
  const messages = useChatStore((state) => state.messages);
  const join = useChatStore((state) => state.join);
  const send = useChatStore((state) => state.send);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-200 p-4 text-neutral-800">
      <div className="flex h-160 max-h-full w-full max-w-sm flex-col rounded-lg bg-white shadow-lg">
        <h1 className="border-b border-neutral-300 px-6 py-5 text-lg font-semibold">
          Chat
        </h1>

        {name ? (
          <>
            <MessageList messages={messages} />
            <MessageForm onSend={send} />
          </>
        ) : (
          <JoinForm onJoin={join} />
        )}
      </div>
    </main>
  );
};

export default App;
