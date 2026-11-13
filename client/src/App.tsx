import { useEffect, useState } from "react";
import { channel, connect } from "./libs/rtc.ts";
import type { Message } from "./chat/message.ts";

const App = () => {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    channel.onmessage = (event) =>
      setMessages((prev) => [...prev, JSON.parse(event.data)]);
  }, []);

  const join = async () => {
    if (!name.trim()) return;
    setJoined(true);
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting to the room:", error);
    }
  };

  const send = () => {
    if (!draft.trim() || channel.readyState !== "open") return;
    const message: Message = {
      name,
      text: draft,
    };
    channel.send(JSON.stringify(message));
    setMessages((prev) => [...prev, message]);
    setDraft("");
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <h1 className="text-xl font-semibold">Chat</h1>

      {joined ? (
        <>
          <ul>
            {messages.map((message, index) => (
              <li key={index}>
                <b>{message.name}:</b> {message.text}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message"
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-white"
            >
              Send
            </button>
          </form>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            join();
          }}
          className="flex gap-2"
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="flex-1 rounded border px-2 py-1"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-white"
          >
            Join
          </button>
        </form>
      )}
    </main>
  );
};

export default App;
