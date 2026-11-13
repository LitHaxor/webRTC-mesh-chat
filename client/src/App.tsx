import { useEffect, useState } from "react";
import { connect, onMessage, sendData } from "./libs/rtc.ts";
import type { Message } from "./chat/message.ts";
import JoinForm from "./components/JoinForm.tsx";
import MessageForm from "./components/MessageForm.tsx";
import MessageList from "./components/MessageList.tsx";

const App = () => {
  const [name, setName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    onMessage((data) => setMessages((prev) => [...prev, JSON.parse(data)]));
  }, []);

  const join = async (name: string) => {
    setName(name);
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting to the room:", error);
    }
  };

  const send = (text: string) => {
    if (!name) return false;
    const message: Message = { name, text };
    if (!sendData(JSON.stringify(message))) {
      return false;
    }
    setMessages((prev) => [...prev, message]);
    return true;
  };

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
